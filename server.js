// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const evaluationRoutes = require('./routes/evaluations');
// Models
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Settings = require('./models/Settings');
const Evaluation = require('./models/Evaluation');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
}));

// DB Connection
mongoose.connect('mongodb+srv://steven:1234@cluster0.4s9eaq9.mongodb.net/teacher_eval?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.get('/', (_, res) => res.send('✅ Backend running!'));

app.use('/api/evaluations', evaluationRoutes);
// Settings Routes
app.get('/settings', async (_, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ evaluationsEnabled: true });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ For Step 2 — update password
app.post('/forgot-password', async (req, res) => {
  const { studentId, newPassword } = req.body;

  if (!studentId || !newPassword) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.password = await bcrypt.hash(newPassword, 10);
    student.mustChangePassword = false;
    await student.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/settings/toggle-evaluations', async (req, res) => {
  try {
    const { enabled } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ evaluationsEnabled: enabled });
    else {
      settings.evaluationsEnabled = enabled;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Authentication Routes
app.post('/login', async (req, res) => {
  const { studentId, password, birthday } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(401).json({ success: false, message: 'Student not found' });

    if (student.mustChangePassword) {
      if (!birthday) return res.status(400).json({ success: false, message: 'Birthday required' });
      if (student.birthday === birthday) return res.json({ success: true, mustChangePassword: true, student });
      return res.status(401).json({ success: false, message: 'Invalid birthday' });
    }

    if (!password) return res.status(400).json({ success: false, message: 'Password required' });
    const match = await bcrypt.compare(password, student.password);
    if (match) return res.json({ success: true, mustChangePassword: false, student });
    res.status(401).json({ success: false, message: 'Invalid password' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/web-login', async (req, res) => {
  const { studentId, birthday, password } = req.body;

  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.json({ success: false, message: 'Student not found' });

    // First login check
    if (student.mustChangePassword) {
      if (!birthday) return res.json({ success: false, message: 'Birthday required' });

      if (student.birthday === birthday) {
        return res.json({
          success: true,
          firstLogin: true,
          student,
        });
      } else {
        return res.json({ success: false, message: 'Invalid birthday' });
      }
    }

    // Normal login with password
    if (!password) return res.json({ success: false, message: 'Password required' });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid password' });
    }

    // Successful login
    res.json({
      success: true,
      firstLogin: false,
      student,
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



app.post('/change-password', async (req, res) => {
  const { studentId, newPassword } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    student.password = await bcrypt.hash(newPassword, 10);
    student.mustChangePassword = false;
    await student.save();
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API Routes
app.use('/evaluations', require('./routes/evaluation'));

app.get('/api/teachers-for-student/:studentId', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/verify-student', async (req, res) => {
  const { studentId, birthday } = req.body;
  try {
    const student = await Student.findOne({ studentId });
    if (student?.birthday === birthday) return res.json({ success: true });
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/evaluations/student/:studentId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json({ success: true, evaluations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/teachers', async (_, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/teachers-for-student/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const teachers = await Teacher.find({ subjects: { $in: student.subjects } });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/evaluations', async (_, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/evaluation/student/:studentId', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json({ success: true, evaluations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/teacher-evaluations/:teacherName', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ teacherName: req.params.teacherName });
    res.json(evaluations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Routes
app.get('/students', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', section = '' } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { studentId: new RegExp(search, 'i') }];
    if (department) query.department = department;
    if (section) query.section = section;

    const students = await Student.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });
    const total = await Student.countDocuments(query);

    res.json({ students, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload Routes
app.post('/upload-students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const students = data.map(item => ({
      studentId: item.studentId ? String(item.studentId).trim() : null,
      name: item.name || item.Name || '',
      birthday: typeof item.birthday === 'number' ? xlsx.SSF.format('yyyy-mm-dd', item.birthday) : (item.birthday || ''),
      department: item.department || '',
      section: item.section || '',
      subjects: item.subjects ? String(item.subjects).split(',').map(s => s.trim()) : [],
    })).filter(student => student.studentId);

    await Student.bulkWrite(students.map(student => ({
      updateOne: {
        filter: { studentId: student.studentId },
        update: {
          $setOnInsert: { password: '', mustChangePassword: true },
          $set: { ...student }
        },
        upsert: true
      }
    })));

    res.json({ success: true, message: `Imported ${students.length} students` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/upload-teachers', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const teachers = data.filter(item => item.name).map(item => ({
      name: item.name,
      subjects: item.subjects ? String(item.subjects).split(',').map(s => s.trim()) : [],
    }));

    const result = await Teacher.bulkWrite(teachers.map(teacher => ({
      updateOne: {
        filter: { name: teacher.name },
        update: { $set: teacher },
        upsert: true
      }
    })));

    res.json({ success: true, message: `Imported teachers: inserted: ${result.upsertedCount}, updated: ${result.modifiedCount}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error during teachers upload' });
  }
});

app.put('/teachers/:id', async (req, res) => {
  try {
    const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTeacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(updatedTeacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
