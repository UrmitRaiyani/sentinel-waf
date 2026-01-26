const mongoose = require('mongoose');

const attackLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  type: { type: String, required: true }, // e.g., "SQL Injection"
  payload: { type: String }, // What they typed
  timestamp: { type: Date, default: Date.now },
  userAgent: { type: String } // Optional: Browser info
});

module.exports = mongoose.model('AttackLog', attackLogSchema);