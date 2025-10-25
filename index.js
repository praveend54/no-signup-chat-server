require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Room = require('./models/Room');
const Message = require('./models/Message');
const { createRoom, endRoom, getRoomInfo } = require('./controllers/rooms');


const app = express();
const server = http.createServer(app);


const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());


app.post('/api/rooms', createRoom);
app.post('/api/rooms/:code/end', endRoom);
app.get('/api/rooms/:code', getRoomInfo);


const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN }
});

io.on('connection', (socket) => {
// socket.join(roomCode) will be called from client
console.log('socket connected', socket.id);


socket.on('join-room', async ({ code, name }, ack) => {
const room = await Room.findOne({ code });
if (!room) return ack && ack({ ok: false, error: 'room_not_found' });
if (room.ended) return ack && ack({ ok: false, error: 'room_ended' });


socket.join(code);
// send previous messages (optional)
const history = await Message.find({ roomCode: code }).sort({ ts: 1 }).limit(200).lean();
ack && ack({ ok: true, history });


// announce
socket.to(code).emit('user-joined', { name });
});


socket.on('send-message', async ({ code, name, text }, ack) => {
if (!text || !code) return;
const msg = new Message({ roomCode: code, sender: name, text });
await msg.save();
io.to(code).emit('new-message', { sender: name, text, ts: msg.ts });
ack && ack({ ok: true });
});


socket.on('leave-room', ({ code, name }) => {
socket.leave(code);
socket.to(code).emit('user-left', { name });
});


socket.on('end-room', async ({ code }) => {
// small safety: check room exists
await Message.deleteMany({ roomCode: code });
await Room.deleteOne({ code });
io.to(code).emit('room-ended');
// optionally disconnect sockets in room
const sockets = await io.in(code).fetchSockets();
for (const s of sockets) {
s.leave(code);
}
});
});

// Added: connect to MongoDB and start the HTTP server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });