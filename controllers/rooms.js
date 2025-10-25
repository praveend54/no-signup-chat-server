const Room = require('../models/Room');
const Message = require('../models/Message');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nano = customAlphabet(alphabet, 6);


async function createRoom(req, res) {
// create unique room code
for (let i = 0; i < 5; i++) {
const code = nano();
try {
const room = new Room({ code });
await room.save();
return res.json({ ok: true, code });
} catch (err) {
// duplicate key maybe: try again
if (err.code === 11000) continue;
console.error(err);
return res.status(500).json({ ok: false, error: 'db_error' });
}
}
return res.status(500).json({ ok: false, error: 'could_not_create_room' });
}


async function endRoom(req, res) {
const { code } = req.params;
try {
// mark ended and delete messages and room doc
await Message.deleteMany({ roomCode: code });
await Room.deleteOne({ code });
return res.json({ ok: true });
} catch (err) {
console.error(err);
return res.status(500).json({ ok: false });
}
}


async function getRoomInfo(req, res) {
const { code } = req.params;
const room = await Room.findOne({ code }).lean();
if (!room) return res.status(404).json({ ok: false, error: 'not_found' });
return res.json({ ok: true, room });
}


module.exports = { createRoom, endRoom, getRoomInfo };