import type { EventContext } from '@cloudflare/workers-types';
import { makeRedis, apiHeaders, type Env } from '../../_shared/redis';

const TTL = 86400;

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPatch({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json() as { code?: string; pin?: string; collectReflections?: boolean };
    const { code, pin, collectReflections } = body;
    if (!code || !pin) {
      return Response.json({ error: 'missing code or pin' }, { status: 400, headers: apiHeaders() });
    }

    const redis = makeRedis(env);

    const raw = await redis.get(`session:${code}`);
    if (!raw) {
      return Response.json({ error: 'session not found or expired' }, { status: 404, headers: apiHeaders() });
    }

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw as any;
    const hashedPin = await hashPin(pin);
    if (hashedPin !== session.facilitatorPin) {
      return Response.json({ error: 'invalid pin' }, { status: 403, headers: apiHeaders() });
    }

    // update config
    if (typeof collectReflections === 'boolean') {
      session.config.collectReflections = collectReflections;
    }

    // preserve remaining TTL
    const ttl = await redis.ttl(`session:${code}`);
    await redis.set(`session:${code}`, JSON.stringify(session), { ex: ttl > 0 ? ttl : TTL });

    return Response.json({ config: session.config }, { status: 200, headers: apiHeaders() });
  } catch (err) {
    console.error('session/config error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
