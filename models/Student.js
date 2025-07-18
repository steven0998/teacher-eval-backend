const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  birthday: { type: String, required: true },
  password: { type: String, default: null },
  mustChangePassword: { type: Boolean, default: true },
  department: { type: String, default: 'Unknown' },   // ✅ always has a value
  section: { type: String, default: 'Unknown' },      // ✅ always has a value
  subjects: [{ type: String }]                        // ✅ subjects array
}, { timestamps: true }); // ✅ adds createdAt & updatedAt

module.exports = mongoose.model('Student', studentSchema);
