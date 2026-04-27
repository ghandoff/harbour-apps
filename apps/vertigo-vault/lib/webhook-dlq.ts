/**
 * Stripe webhook dead-letter queue + dedup helper for the CF Workers
 * runtime.
 *
 * WHY: Stripe will retry 5xx responses up to ~3 days, then give up. On
 * Vercel today this is fine — the function returns 200 fast or 500 fast
 * and Stripe's retry envelope absorbs transient failures. On CF Workers,
 * we want a paper trail of any event that failed all auto-retries so an
 * operator can replay it manually.
 *
 * Also adds a request-level dedup check: Stripe occasionally re-delivers
 * the same event after we've already processed it (e.g. our 200 was
 * dropped in transit). The webhook handler already has a DB-level
 * idempotency check on stripe_session_id, but checking the KV first
 * avoids re-running signature verification + DB queries when the same
 * event id arrives twice in quick succession.
 *
 * Pattern (CF Workers, Gate A.1 → KV):
 *   import { withDLQ } from "@/lib/webhook-dlq";
 *   import { getCloudflareContext } from "@opennextjs/cloudflare";
 *
 *   const innerHandler = async (req: Request) => { ... existing logic ... };
 *
 *   export const POST = withDLQ(innerHandler, {
 *     getStore: () => getCloudflareContext().env.STRIPE_DLQ,
 *   });
 *
 * Pattern (Vercel — current production runtime):
 *   The vault is staying on Vercel for now. To preserve current
 *   behaviour on Vercel where there is no KV binding, callers may pass
 *   `getStore: () => null`. With a null store, the wrapper degrades to
 *   a passthrough — no dedup, no DLQ persistence — matching today's
 *   semantics exactly. This means the wrapped route is safe to ship on
 *   both runtimes ahead of the cutover.
 */

export interface DLQStore {
  get(
    key: string,
    options?: { type?: "text" | "json" },
  ): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export interface WithDLQOptions {
  /**
   * Returns the KV (or KV-shaped) store at request time. May return
   * `null` to disable dead-letter persistence + dedup entirely
   * (passthrough mode — used when running on Vercel until the CF
   * cutover, where there is no KV binding available).
   *
   * Resolved per-request because OpenNext's getCloudflareContext() is
   * only safe to call inside a request scope.
   */
  getStore: () => DLQStore | null;
  /**
   * Time-to-live for DLQ entries, in seconds. Default 7 days — long
   * enough to outlast Stripe's auto-retry window so an operator can
   * replay anything that exhausted the retries.
   */
  ttlSeconds?: number;
}

const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days

const dedupKey = (eventId: string) => `stripe-evt-processed:${eventId}`;
const dlqKey = (eventId: string) => `stripe-evt-dlq:${eventId}`;

/**
 * Pulled out of the body so callers can replay a stored event by hand
 * (replay-webhook route uses this to reconstruct the original Request).
 */
export interface DLQEntry {
  event_id: string;
  payload_raw: string;
  signature: string | null;
  error_msg: string;
  ts: number;
}

/**
 * Wrap a Stripe webhook route handler with dedup + DLQ persistence.
 *
 * Flow:
 *   1. Read the request body (consumes the stream — we re-attach it
 *      below before delegating).
 *   2. Try to extract `event.id` by JSON-parsing the body. If parsing
 *      fails or there's no id, skip the dedup check entirely (let the
 *      inner handler do its own signature verification and decide).
 *   3. If the store says we've seen this event id, return 200
 *      immediately without invoking the inner handler.
 *   4. Otherwise call the inner handler with a fresh Request carrying
 *      the same body + headers.
 *   5. On 2xx: record the event id in the dedup namespace (TTL =
 *      ttlSeconds).
 *   6. On thrown error or 5xx: persist to DLQ namespace and re-throw /
 *      return the original failure so Stripe sees the 5xx and triggers
 *      its own retry.
 */
export function withDLQ(
  handler: (req: Request) => Promise<Response>,
  options: WithDLQOptions,
): (req: Request) => Promise<Response> {
  const ttl = options.ttlSeconds ?? DEFAULT_TTL;

  return async (req: Request): Promise<Response> => {
    const store = options.getStore();
    const bodyText = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Parse just to grab the event id; the inner handler does its own
    // signature verification and full parse.
    let eventId: string | null = null;
    try {
      const parsed = JSON.parse(bodyText) as { id?: unknown };
      if (typeof parsed.id === "string") {
        eventId = parsed.id;
      }
    } catch {
      // Malformed JSON — let the inner handler reject it normally.
    }

    // Dedup short-circuit (only when store is available + we have an id).
    if (store !== null && eventId !== null) {
      const seen = await store.get(dedupKey(eventId));
      if (seen !== null) {
        return new Response(
          JSON.stringify({ received: true, dedup: true }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }
    }

    // Re-attach the body to a fresh Request because we consumed the
    // original stream above. Headers carry forward verbatim so signature
    // verification still works.
    const innerReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });

    let response: Response;
    try {
      response = await handler(innerReq);
    } catch (err) {
      // Inner handler threw — persist to DLQ if possible, then re-throw
      // so Stripe sees a 5xx via Next.js's default error response.
      if (store !== null && eventId !== null) {
        const entry: DLQEntry = {
          event_id: eventId,
          payload_raw: bodyText,
          signature,
          error_msg: err instanceof Error ? err.message : String(err),
          ts: Date.now(),
        };
        try {
          await store.put(dlqKey(eventId), JSON.stringify(entry), {
            expirationTtl: ttl,
          });
        } catch (kvErr) {
          console.error("[webhook-dlq] failed to persist DLQ entry:", kvErr);
        }
      }
      throw err;
    }

    if (response.status >= 500) {
      // Persist 5xx to DLQ for replay.
      if (store !== null && eventId !== null) {
        const entry: DLQEntry = {
          event_id: eventId,
          payload_raw: bodyText,
          signature,
          error_msg: `inner handler returned ${response.status}`,
          ts: Date.now(),
        };
        try {
          await store.put(dlqKey(eventId), JSON.stringify(entry), {
            expirationTtl: ttl,
          });
        } catch (kvErr) {
          console.error("[webhook-dlq] failed to persist DLQ entry:", kvErr);
        }
      }
      return response;
    }

    if (response.status >= 200 && response.status < 300) {
      if (store !== null && eventId !== null) {
        try {
          await store.put(dedupKey(eventId), String(Date.now()), {
            expirationTtl: ttl,
          });
        } catch (kvErr) {
          // Dedup miss is non-fatal — worst case is a duplicate
          // delivery falling through to the DB-level idempotency check.
          console.error("[webhook-dlq] failed to mark dedup:", kvErr);
        }
      }
    }

    return response;
  };
}

/**
 * Read a DLQ entry by event id. Used by the replay-webhook route.
 * Returns null if the entry doesn't exist or has expired.
 */
export async function readDLQEntry(
  store: DLQStore,
  eventId: string,
): Promise<DLQEntry | null> {
  const raw = await store.get(dlqKey(eventId));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as DLQEntry;
  } catch {
    return null;
  }
}
