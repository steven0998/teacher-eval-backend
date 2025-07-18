const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    teacherName: { type: String, required: true },
    subject: { type: String, required: true },
    answers: { type: Object, required: true },
    comment: { type: String },
  },
  {
    timestamps: true, // ✅ This adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Evaluation', EvaluationSchema);
