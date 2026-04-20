import { WebSocketServer, WebSocket } from 'ws';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.WS_PORT ?? 8787);
const __dirname = dirname(fileURLToPath(import.meta.url));
const logPath = `${__dirname}/events.log`;
try { mkdirSync(dirname(logPath), { recursive: true }); } catch { /* ignore */ }

interface Room {
  sockets: Set<WebSocket>;
  lastState?: unknown;
}

const rooms = new Map<string, Room>();

function ensureRoom(session: string): Room {
  let room = rooms.get(session);
  if (!room) {
    room = { sockets: new Set() };
    rooms.set(session, room);
  }
  return room;
}

const wss = new WebSocketServer({ port: PORT });
console.log(`[values-auction] ws server listening on :${PORT}`);

wss.on('connection', (socket, req) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const session = url.searchParams.get('session') ?? 'DEMO';
  const role = url.searchParams.get('role') ?? 'participant';
  const room = ensureRoom(session);
  room.sockets.add(socket);
  console.log(`[values-auction] join session=${session} role=${role} (${room.sockets.size} total)`);

  if (room.lastState) {
    socket.send(JSON.stringify({ type: 'state', payload: room.lastState, at: Date.now(), sender: 'server' }));
  }

  socket.on('message', (raw) => {
    let msg: any;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    try {
      appendFileSync(logPath, JSON.stringify({ session, at: Date.now(), msg }) + '\n');
    } catch { /* ignore */ }
    if (msg.type === 'state') room.lastState = msg.payload;
    for (const other of room.sockets) {
      if (other !== socket && other.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify(msg));
      }
    }
  });

  socket.on('close', () => {
    room.sockets.delete(socket);
    if (room.sockets.size === 0) {
      rooms.delete(session);
    }
  });
});
