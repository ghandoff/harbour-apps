import type { EventContext } from '@cloudflare/workers-types';
import { makeRedis, apiHeaders, type Env } from '../../_shared/redis';

const TTL = 86400;

export async function onRequestPost({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const body = await request.json() as { code?: string };
    const { code } = body;
    if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
      return Response.json({ error: 'invalid session code' }, { status: 400, headers: apiHeaders() });
    }

    const upperCode = code.toUpperCase();
    const redis = makeRedis(env);

    const raw = await redis.get(`session:${upperCode}`);
    if (!raw) {
      return Response.json({ error: 'session not found or expired' }, { status: 404, headers: apiHeaders() });
    }

    // generate participant ID
    const pid = crypto.randomUUID();

    // register student
    await redis.sadd(`session:${upperCode}:students`, pid);
    await redis.expire(`session:${upperCode}:students`, TTL);

    const student = {
      joinedAt: new Date().toISOString(),
      currentScenario: null,
      progress: {},
    };
    await redis.set(`student:${upperCode}:${pid}`, JSON.stringify(student), { ex: TTL });

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return Response.json(
      {
        participantId: pid,
        sessionCode: upperCode,
        config: (session as any).config || { collectReflections: true },
      },
      { status: 200, headers: apiHeaders() }
    );
  } catch (err) {
    console.error('session/join error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
