import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const TTL = 86400; // 24 hours

// 6-char alphanumeric, excluding confusables (0/O/1/I/L)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679';
function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// simple hash for facilitator PIN (not crypto-grade, but sufficient for ephemeral 24hr sessions)
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'st-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { pin } = req.body || {};
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'pin must be exactly 4 digits' });
    }

    // generate unique session code
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const exists = await redis.exists(`session:${code}`);
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return res.status(503).json({ error: 'could not generate unique code, try again' });
    }

    const hashedPin = await hashPin(pin);
    const session = {
      facilitatorPin: hashedPin,
      createdAt: new Date().toISOString(),
      config: { collectReflections: true },
    };

    await redis.set(`session:${code}`, JSON.stringify(session), { ex: TTL });

    return res.status(200).json({ code, createdAt: session.createdAt });
  } catch (err) {
    console.error('session/create error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
