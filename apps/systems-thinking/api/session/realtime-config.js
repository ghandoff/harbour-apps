// returns the partykit host so the facilitator dashboard knows where to open
// its websocket. when PARTYKIT_HOST is not set, the dashboard falls back to
// the existing 8-second polling loop.
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const host = process.env.PARTYKIT_HOST || null;
  return res.status(200).json({ host, available: !!host });
}
