const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  markAttendance,
  getAttendanceByBatchAndDate,
  getAttendanceByStudent,
  getBatchAttendanceSummary,
} = require('../controllers/attendanceController');

router.post('/', protect, authorize('admin', 'teacher'), markAttendance);
router.get('/', protect, authorize('admin', 'teacher'), getAttendanceByBatchAndDate);
router.get('/student/:studentId', protect, getAttendanceByStudent);
router.get('/summary/:batchId', protect, authorize('admin', 'teacher'), getBatchAttendanceSummary);

module.exports = router;