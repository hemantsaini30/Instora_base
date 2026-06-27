const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createStudent, getAllStudents, getStudentById, deleteStudent } = require('../controllers/studentController');

router.use(protect, authorize('admin'));

router.get('/', getAllStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);
router.delete('/:id', deleteStudent);

module.exports = router;