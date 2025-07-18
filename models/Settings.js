const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  evaluationsEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('Settings', SettingsSchema);