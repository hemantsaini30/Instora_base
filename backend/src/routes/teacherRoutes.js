const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createTeacher, getAllTeachers, deleteTeacher, resetTeacherPassword } = require('../controllers/teacherController');

router.use(protect, authorize('admin'));

router.get('/', getAllTeachers);
router.post('/', createTeacher);
router.delete('/:id', deleteTeacher);
router.patch('/:id/reset-password', resetTeacherPassword);

module.exports = router;