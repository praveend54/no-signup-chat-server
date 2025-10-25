const mongoose = require('mongoose');


const roomSchema = new mongoose.Schema({
code: { type: String, unique: true, index: true },
createdAt: { type: Date, default: Date.now },
ended: { type: Boolean, default: false },
// optional expiry: automatically delete after X seconds by TTL index
expiresAt: { type: Date }
});


// Optional: create TTL index if you set expiresAt when creating rooms (e.g. Date.now() + 24h)
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


module.exports = mongoose.model('Room', roomSchema);