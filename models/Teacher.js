// models/Teacher.js
const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjects: [{ type: String }]
});

module.exports = mongoose.model('Teacher', TeacherSchema);
