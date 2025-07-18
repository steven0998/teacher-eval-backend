const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');

mongoose.connect('mongodb://127.0.0.1:27017/teacher_eval', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB error:', err));

async function seedData() {
  // Clear existing data
  await Student.deleteMany({});
  await Teacher.deleteMany({});

  // Load students.xlsx
  const studentsWorkbook = XLSX.readFile('students.xlsx');
  const studentsSheet = studentsWorkbook.Sheets[studentsWorkbook.SheetNames[0]];
  const students = XLSX.utils.sheet_to_json(studentsSheet);

  await Student.insertMany(students);
  console.log('Students added from Excel');

  // Load teachers.xlsx
  const teachersWorkbook = XLSX.readFile('teachers.xlsx');
  const teachersSheet = teachersWorkbook.Sheets[teachersWorkbook.SheetNames[0]];
  const rawTeachers = XLSX.utils.sheet_to_json(teachersSheet);

  // Map subjects string to array
  const teachers = rawTeachers.map(t => ({
    teacherId: t.teacherId,
    name: t.name,
    subjects: (t.subjects || '').split(',').map(s => s.trim()).filter(s => s)

  }));

  await Teacher.insertMany(teachers);
  console.log('Teachers added from Excel');

  process.exit();
}

seedData();
