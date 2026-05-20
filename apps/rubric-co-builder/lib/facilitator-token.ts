// HMAC-SHA256 facilitator token — stateless, no DB column required.
// Token = hex(HMAC(FACILITATOR_SECRET, roomCode)).
// The server generates it on room creation and the host stores it in sessionStorage.

const encoder = new TextEncoder();

function getSecret(): string {
  return process.env.FACILITATOR_SECRET ?? "rcb-demo-secret-not-for-production";
}

async function hmacSign(code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(code));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function generateFacilitatorToken(code: string): Promise<string> {
  return hmacSign(code);
}

export async function verifyFacilitatorToken(code: string, token: string): Promise<boolean> {
  if (!token) return false;
  const expected = await hmacSign(code);
  return constantTimeEqual(expected, token);
}

export function extractBearer(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function isFacilitatorAuthorized(req: Request, code: string): Promise<boolean> {
  return verifyFacilitatorToken(code, extractBearer(req));
}
