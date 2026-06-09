const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory room store: roomCode -> { peerId, createdAt }
const rooms = new Map();

// Clean up rooms older than 30 minutes
const ROOM_TTL_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(code);
      console.log(`[Cleanup] Expired room: ${code}`);
    }
  }
}, 60 * 1000);

// Generate a human-readable 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/create-room
// Body: { peerId: string }
// Response: { roomCode: string }
app.post('/api/create-room', (req, res) => {
  const { peerId } = req.body;

  if (!peerId || typeof peerId !== 'string') {
    return res.status(400).json({ error: 'peerId is required' });
  }

  // Generate a unique room code
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  rooms.set(roomCode, { peerId, createdAt: Date.now() });

  console.log(`[Room Created] Code: ${roomCode} | PeerId: ${peerId}`);
  res.json({ roomCode });
});

// GET /api/join-room/:roomCode
// Response: { peerId: string }
app.get('/api/join-room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const upperCode = roomCode.toUpperCase();

  if (!rooms.has(upperCode)) {
    return res.status(404).json({ error: 'Room not found or expired' });
  }

  const room = rooms.get(upperCode);
  console.log(`[Room Joined] Code: ${upperCode} | PeerId: ${room.peerId}`);
  res.json({ peerId: room.peerId });
});

// DELETE /api/room/:roomCode
// Called when host disconnects
app.delete('/api/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const upperCode = roomCode.toUpperCase();

  if (rooms.has(upperCode)) {
    rooms.delete(upperCode);
    console.log(`[Room Deleted] Code: ${upperCode}`);
  }

  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`🚀 Chess Signaling Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
