const Student = require('../models/Student');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createStudent = async (req, res, next) => {
  try {
    const { fullName, username, password, parentPhone, batchId } = req.body;
    if (!fullName || !username || !password || !parentPhone || !batchId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role: 'student' });
    const student = await Student.create({ userId: user._id, fullName, parentPhone, batchId });
    const populated = await Student.findById(student._id).populate('userId', 'username').populate('batchId', 'name course');
    res.status(201).json({ success: true, message: 'Student created', data: populated });
  } catch (error) {
    next(error);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate('userId', 'username')
      .populate('batchId', 'name course')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'username')
      .populate('batchId', 'name course');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    await User.findByIdAndDelete(student.userId);
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createStudent, getAllStudents, getStudentById, deleteStudent };