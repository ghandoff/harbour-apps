import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const TTL = 86400;

async function broadcastToRoom(code, payload) {
  const host = process.env.PARTYKIT_HOST;
  const secret = process.env.PARTYKIT_INTERNAL_SECRET;
  if (!host || !secret) return; // realtime not configured — skip silently
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  try {
    await fetch(`${protocol}://${host}/parties/main/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('partykit broadcast failed:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { code } = req.body || {};
    if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
      return res.status(400).json({ error: 'invalid session code' });
    }

    const upperCode = code.toUpperCase();
    const raw = await redis.get(`session:${upperCode}`);
    if (!raw) {
      return res.status(404).json({ error: 'session not found or expired' });
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

    await broadcastToRoom(upperCode, {
      type: 'student-joined',
      participantId: pid,
      joinedAt: student.joinedAt,
    });

    return res.status(200).json({
      participantId: pid,
      sessionCode: upperCode,
      config: session.config || { collectReflections: true },
    });
  } catch (err) {
    console.error('session/join error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
