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
    const format = searchParams.get('format');

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

    // gather all data
    const studentIds = await redis.smembers(`session:${code}:students`);
    const exportData: {
      sessionCode: string;
      createdAt: string;
      config: any;
      participants: any[];
    } = {
      sessionCode: code,
      createdAt: session.createdAt,
      config: session.config,
      participants: [],
    };

    for (const pid of studentIds) {
      const studentRaw = await redis.get(`student:${code}:${pid}`);
      const student = studentRaw
        ? (typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw as any)
        : { joinedAt: null, progress: {} };

      const eventsRaw = await redis.lrange(`events:${code}:${pid}`, 0, -1);
      const events = eventsRaw.map((e: any) => typeof e === 'string' ? JSON.parse(e) : e);

      exportData.participants.push({
        participantId: pid,
        joinedAt: student.joinedAt,
        currentScenario: student.currentScenario,
        progress: student.progress,
        events,
      });
    }

    if (format === 'csv') {
      const rows: string[][] = [['timestamp', 'participant_id', 'event_type', 'scenario', 'intervention_id', 'dosage', 'text_value']];
      exportData.participants.forEach((p: any) => {
        p.events.forEach((evt: any) => {
          rows.push([
            evt.timestamp || '',
            p.participantId,
            evt.type || '',
            evt.data?.scenario || '',
            evt.data?.interventionId || '',
            String(evt.data?.dosage ?? ''),
            evt.data?.text || '',
          ]);
        });
      });
      const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          ...apiHeaders(),
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="session-${code}.csv"`,
        },
      });
    }

    // default: JSON
    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        ...apiHeaders(),
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="session-${code}.json"`,
      },
    });
  } catch (err) {
    console.error('session/export error:', err);
    return Response.json({ error: 'internal error' }, { status: 500, headers: apiHeaders() });
  }
}
