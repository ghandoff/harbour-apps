import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /harbour/api/harbour/register-interest
 *
 * Body: { email, context, appSlug? }
 *
 * Adds the contact to a per-context Resend audience (creating it
 * lazily) and sends a short confirmation email. Errors against
 * Resend are logged and swallowed — the user-facing flow always
 * resolves to ok, mirroring vault's purchase-confirmation pattern.
 */

type Context = "wave-2" | "drydock" | "pier-b-prme" | "pier-a";

const AUDIENCE_BY_CONTEXT: Record<Context, string> = {
  "wave-2": "harbour-wave2-waitlist",
  drydock: "harbour-drydock-notify",
  "pier-b-prme": "harbour-prme-interest",
  "pier-a": "harbour-pier-a-interest",
};

const CONFIRMATION_COPY: Record<Context, { subject: string; body: string }> = {
  "wave-2": {
    subject: "you're on the pier c waitlist — winded.vertigo",
    body: "thanks for joining the family-play waitlist. we'll write when raft.house, creaseworks and deep.deck are ready to play with (end of june).",
  },
  drydock: {
    subject: "you're on the drydock notify list — winded.vertigo",
    body: "thanks — we'll write when new threshold-concept apps open up.",
  },
  "pier-b-prme": {
    subject: "you're on the prme interest list — winded.vertigo",
    body: "thanks for the interest. we'll write the moment this tool is ready for classroom use.",
  },
  "pier-a": {
    subject: "you're on the leadership interest list — winded.vertigo",
    body: "thanks — we'll be in touch when this tool opens for facilitator use.",
  },
};

let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "noreply@windedvertigo.com";

// audience_id cache (per worker instance) — avoids a list+find on every submit
const audienceIdCache = new Map<string, string>();

function isValidEmail(input: unknown): input is string {
  return (
    typeof input === "string" &&
    input.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
  );
}

function isValidContext(input: unknown): input is Context {
  return (
    typeof input === "string" &&
    Object.prototype.hasOwnProperty.call(AUDIENCE_BY_CONTEXT, input)
  );
}

async function resolveAudienceId(name: string): Promise<string> {
  const cached = audienceIdCache.get(name);
  if (cached) return cached;

  const resend = getResend();
  const list = await resend.audiences.list();
  const existing = list.data?.data?.find((a) => a.name === name);
  if (existing) {
    audienceIdCache.set(name, existing.id);
    return existing.id;
  }

  const created = await resend.audiences.create({ name });
  if (!created.data?.id) {
    throw new Error(`failed to create audience ${name}`);
  }
  audienceIdCache.set(name, created.data.id);
  return created.data.id;
}

// ── rate limit ────────────────────────────────────────────
// Per-IP token bucket: 5 requests per 60 seconds. State is module-scoped
// so it's per-isolate; CF spreads traffic across isolates so this is
// best-effort, not strictly accurate — sufficient to deter scripted
// abuse without standing up a Durable Object for global state.
const RATE_LIMIT = { capacity: 5, refillMs: 60_000 };
const buckets = new Map<string, { tokens: number; refillAt: number }>();

function takeToken(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now >= bucket.refillAt) {
    buckets.set(ip, {
      tokens: RATE_LIMIT.capacity - 1,
      refillAt: now + RATE_LIMIT.refillMs,
    });
    return true;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!takeToken(ip)) {
    return NextResponse.json(
      { error: "rate limited — try again in a minute" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  let body: { email?: unknown; context?: unknown; appSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  if (!isValidContext(body.context)) {
    return NextResponse.json({ error: "invalid context" }, { status: 400 });
  }
  const appSlug =
    typeof body.appSlug === "string" && body.appSlug.length < 80
      ? body.appSlug
      : undefined;

  const email = body.email;
  const context = body.context;
  const audienceName = AUDIENCE_BY_CONTEXT[context];

  try {
    const audienceId = await resolveAudienceId(audienceName);
    const resend = getResend();

    const contactResult = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });
    // "already exists" surfaces as a 4xx with name "validation_error" —
    // we treat it as success since the contact is already in the audience.
    if (contactResult.error && contactResult.error.name !== "validation_error") {
      console.warn("[register-interest] contact create returned error:", contactResult.error);
    }

    const copy = CONFIRMATION_COPY[context];
    const subject = copy.subject;
    const text = appSlug
      ? `${copy.body}\n\n(${appSlug})\n\n— winded.vertigo`
      : `${copy.body}\n\n— winded.vertigo`;

    const emailResult = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      text,
    });
    if (emailResult.error) {
      console.warn("[register-interest] confirmation email failed:", emailResult.error);
    }
  } catch (err) {
    console.error("[register-interest] resend error:", err);
    // Swallow: the user has done their part. We'd rather record the
    // submission attempt than block the UX on a transient Resend issue.
  }

  return NextResponse.json({ ok: true });
}
