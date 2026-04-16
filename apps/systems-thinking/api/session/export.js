import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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
    const { code, pin, format } = req.query;
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

    // gather all data
    const studentIds = await redis.smembers(`session:${code}:students`);
    const exportData = {
      sessionCode: code,
      createdAt: session.createdAt,
      config: session.config,
      participants: [],
    };

    for (const pid of studentIds) {
      const studentRaw = await redis.get(`student:${code}:${pid}`);
      const student = studentRaw
        ? (typeof studentRaw === 'string' ? JSON.parse(studentRaw) : studentRaw)
        : { joinedAt: null, progress: {} };

      const eventsRaw = await redis.lrange(`events:${code}:${pid}`, 0, -1);
      const events = eventsRaw.map(e => typeof e === 'string' ? JSON.parse(e) : e);

      exportData.participants.push({
        participantId: pid,
        joinedAt: student.joinedAt,
        currentScenario: student.currentScenario,
        progress: student.progress,
        events,
      });
    }

    if (format === 'csv') {
      // flatten to CSV
      const rows = [['timestamp', 'participant_id', 'event_type', 'scenario', 'intervention_id', 'dosage', 'text_value']];
      exportData.participants.forEach(p => {
        p.events.forEach(evt => {
          rows.push([
            evt.timestamp || '',
            p.participantId,
            evt.type || '',
            evt.data?.scenario || '',
            evt.data?.interventionId || '',
            evt.data?.dosage ?? '',
            evt.data?.text || '',
          ]);
        });
      });
      const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="session-${code}.csv"`);
      return res.status(200).send(csv);
    }

    // default: JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="session-${code}.json"`);
    return res.status(200).json(exportData);
  } catch (err) {
    console.error('session/export error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
