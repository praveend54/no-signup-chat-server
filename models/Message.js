const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
roomCode: { type: String, index: true },
sender: String, // ephemeral username (e.g. Guest-1234)
text: String,
ts: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Message', messageSchema);