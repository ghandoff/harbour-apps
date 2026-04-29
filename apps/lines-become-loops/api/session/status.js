import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// simple hash to verify facilitator PIN
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { code, pin } = req.query;
    if (!code || !pin) {
      return res.status(400).json({ error: 'missing code or pin' });
    }

    const raw = await redis.get(`session:${code}`);
    if (!raw) {
      return res.status(404).json({ error: 'session not found or expired' });
    }

    const session = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const hashedPin = await hashPin(pin);
    if (hashedPin !== session.facilitatorPin) {
      return res.status(403).json({ error: 'invalid pin' });
    }

    // get connected students
    const studentIds = await redis.smembers(`session:${code}:students`);
    const students = [];

    for (const pid of studentIds) {
      const studentRaw = await redis.get(`student:${code}:${pid}`);
      if (studentRaw) {
        const student = typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw;
        students.push({
          participantId: pid,
          joinedAt: student.joinedAt,
          currentScenario: student.currentScenario,
          progress: student.progress || {},
        });
      }
    }

    return res.status(200).json({
      code,
      createdAt: session.createdAt,
      config: session.config,
      studentCount: students.length,
      students,
    });
  } catch (err) {
    console.error('session/status error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
