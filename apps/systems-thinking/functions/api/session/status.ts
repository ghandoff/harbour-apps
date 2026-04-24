import type { EventContext } from '@cloudflare/workers-types';
import { makeRedis, apiHeaders, type Env } from '../../_shared/redis';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env }: EventContext<Env, any, any>): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const pin = searchParams.get('pin');

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

    // get connected students
    const studentIds = await redis.smembers(`session:${code}:students`);
    const students = [];

    for (const pid of studentIds) {
      const studentRaw = await redis.get(`student:${code}:${pid}`);
      if (studentRaw) {
        const student = typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw as any;
        students.push({
          participantId: pid,
          joinedAt: student.joinedAt,
          currentScenario: student.currentScenario,
          progress: student.progress || {},
        });
      }
    }

    return Response.json(
      {
        code,
        createdAt: session.createdAt,
        config: session.config,
        studentCount: students.length,
        students,
      },
      { status: 200, headers: apiHeaders() }
    );
  } catch (err) {
    console.error('session/status error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
