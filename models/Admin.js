// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: String,
  password: String // You should hash this in production
});

module.exports = mongoose.model('Admin', adminSchema);
