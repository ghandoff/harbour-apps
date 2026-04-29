import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const TTL = 86400;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    // supports both JSON body and sendBeacon text
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { sessionCode, participantId, type, data } = body || {};

    if (!sessionCode || !participantId || !type) {
      return res.status(400).json({ error: 'missing required fields' });
    }

    // verify session exists
    const raw = await redis.get(`session:${sessionCode}`);
    if (!raw) {
      return res.status(404).json({ error: 'session not found' });
    }

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // if reflections are disabled, reject text events
    const textEvents = ['hypothesis_written', 'shifted_written'];
    if (!session.config?.collectReflections && textEvents.includes(type)) {
      return res.status(200).json({ ok: true, skipped: true });
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
      const student = typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw;
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

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('session/log error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
