const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Settings = require('../models/Settings');

// POST evaluation
router.post('/', async (req, res) => {
  console.log('📥 Received /evaluations POST:', req.body);
  try {
    const settings = await Settings.findOne();
    if (!settings?.evaluationsEnabled) {
      return res.status(403).json({ success: false, message: 'Evaluations disabled by admin' });
    }

    const { studentId, teacherName, subject, answers, comment } = req.body;
    if (!studentId || !teacherName || !subject || !answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const safeAnswers = Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [k.replace(/\./g, '_'), v])
    );

    const saved = await Evaluation.create({
      studentId,
      teacherName,
      subject,
      answers: safeAnswers,
      comment: comment || '',
    });

    res.json({ success: true, id: saved._id });
  } catch (err) {
    console.error('❌ Error saving evaluation:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:studentId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ studentId: req.params.studentId });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch evaluations' });
  }
});

router.get('/evaluation-status', async (req, res) => {
  const { studentId } = req.query;
  try {
    const evaluations = await Evaluation.find({ studentId });
    const evaluated = evaluations.map(e => ({
      teacherName: e.teacherName,
      subject: e.subject,
    }));
    res.json(evaluated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// GET all evaluations
router.get('/', async (_, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
