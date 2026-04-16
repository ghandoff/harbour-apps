import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const TTL = 86400;

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { code, pin, collectReflections } = req.body || {};
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

    // update config
    if (typeof collectReflections === 'boolean') {
      session.config.collectReflections = collectReflections;
    }

    // preserve remaining TTL
    const ttl = await redis.ttl(`session:${code}`);
    await redis.set(`session:${code}`, JSON.stringify(session), { ex: ttl > 0 ? ttl : TTL });

    return res.status(200).json({ config: session.config });
  } catch (err) {
    console.error('session/config error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
