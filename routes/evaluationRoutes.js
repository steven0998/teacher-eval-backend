// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Settings = require('../models/Settings');

// Submit new evaluation
router.post('/evaluations', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings?.evaluationsEnabled) {
      return res.status(403).json({ success: false, message: 'Evaluations disabled by admin' });
    }
    const evalDoc = await new Evaluation(req.body).save();
    res.json({ success: true, id: evalDoc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all evaluations
router.get('/evaluations', async (_, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get evaluations for a specific teacher
router.get('/teacher-evaluations/:teacherName', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ teacherName: req.params.teacherName });
    res.json(evaluations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
