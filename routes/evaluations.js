const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Settings = require('../models/Settings');

router.post('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings?.evaluationsEnabled) {
      return res.status(403).json({ success: false, message: 'Evaluations are currently disabled by the admin.' });
    }

    const { studentId, teacherName, subject, answers, comment } = req.body;

    if (!studentId || !teacherName || !subject || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing or invalid required fields.' });
    }

    const safeAnswers = {};
    for (const [key, value] of Object.entries(answers)) {
      const sanitizedKey = key.replace(/\./g, '_');
      safeAnswers[sanitizedKey] = value;
    }

    const ratingValues = Object.values(safeAnswers)
      .map(val => Number(val))
      .filter(num => !isNaN(num));

    const averageRating = ratingValues.length
      ? ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length
      : 0;

    const newEvaluation = await Evaluation.create({
      studentId,
      teacherName,
      subject,
      answers: safeAnswers,
      comment: comment || '',
      rating: averageRating.toFixed(2),
    });

    res.json({ success: true, id: newEvaluation._id });
  } catch (err) {
    console.error('Error saving evaluation:', err.message);
    res.status(500).json({ success: false, message: 'Server error while saving evaluation.' });
  }
});

module.exports = router;
