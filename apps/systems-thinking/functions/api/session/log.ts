import type { EventContext } from '@cloudflare/workers-types';
import { makeRedis, apiHeaders, type Env } from '../../_shared/redis';

const TTL = 86400;

export async function onRequestPost({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    // supports both JSON body and sendBeacon text/plain
    let body: Record<string, any>;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('text/plain')) {
      const text = await request.text();
      body = JSON.parse(text);
    } else {
      body = await request.json() as Record<string, any>;
    }

    const { sessionCode, participantId, type, data } = body;

    if (!sessionCode || !participantId || !type) {
      return Response.json({ error: 'missing required fields' }, { status: 400, headers: apiHeaders() });
    }

    const redis = makeRedis(env);

    // verify session exists
    const raw = await redis.get(`session:${sessionCode}`);
    if (!raw) {
      return Response.json({ error: 'session not found' }, { status: 404, headers: apiHeaders() });
    }

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // if reflections are disabled, reject text events
    const textEvents = ['hypothesis_written', 'shifted_written'];
    if (!(session as any).config?.collectReflections && textEvents.includes(type)) {
      return Response.json({ ok: true, skipped: true }, { status: 200, headers: apiHeaders() });
    }

    const event = {
      type,
      data: data || {},
      timestamp: new Date().toISOString(),
    };

    // append to event list
    const key = `events:${sessionCode}:${participantId}`;
    await redis.rpush(key, JSON.stringify(event));
    await redis.expire(key, TTL);

    // update student progress
    const studentKey = `student:${sessionCode}:${participantId}`;
    const studentRaw = await redis.get(studentKey);
    if (studentRaw) {
      const student = typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw as any;
      if (data?.scenario) student.currentScenario = data.scenario;
      if (type === 'scenario_started' && data?.scenario) {
        student.progress[data.scenario] = { started: true };
      }
      if (type === 'slider_move' && data?.scenario) {
        if (!student.progress[data.scenario]) student.progress[data.scenario] = {};
        student.progress[data.scenario].interacting = true;
      }
      await redis.set(studentKey, JSON.stringify(student), { ex: TTL });
    }

    return Response.json({ ok: true }, { status: 200, headers: apiHeaders() });
  } catch (err) {
    console.error('session/log error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
