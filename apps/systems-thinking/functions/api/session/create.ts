import type { EventContext } from '@cloudflare/workers-types';
import { makeRedis, apiHeaders, type Env } from '../../_shared/redis';

const TTL = 86400; // 24 hours

// 6-char alphanumeric, excluding confusables (0/O/1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679';
function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json() as { pin?: string };
    const { pin } = body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: 'pin must be exactly 4 digits' }, { status: 400, headers: apiHeaders() });
    }

    const redis = makeRedis(env);

    // generate unique session code
    let code: string = '';
    let attempts = 0;
    do {
      code = generateCode();
      const exists = await redis.exists(`session:${code}`);
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return Response.json({ error: 'could not generate unique code, try again' }, { status: 503, headers: apiHeaders() });
    }

    const hashedPin = await hashPin(pin);
    const session = {
      facilitatorPin: hashedPin,
      createdAt: new Date().toISOString(),
      config: { collectReflections: true },
    };

    await redis.set(`session:${code}`, JSON.stringify(session), { ex: TTL });

    return Response.json({ code, createdAt: session.createdAt }, { status: 200, headers: apiHeaders() });
  } catch (err) {
    console.error('session/create error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
