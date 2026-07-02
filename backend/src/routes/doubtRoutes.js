const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getAvailableTeachers, createSessions, getMySessionsStudent,
  getSessionsForTeacher, getMessages, sendMessage, toggleSave, resolveSession,
} = require('../controllers/doubtController');

router.use(protect);

router.get('/available-teachers',        authorize('student'),           getAvailableTeachers);
router.post('/sessions',                 authorize('student'),           createSessions);
router.get('/sessions/mine',             authorize('student'),           getMySessionsStudent);
router.get('/sessions/teacher',          authorize('teacher'),           getSessionsForTeacher);
router.get('/sessions/:id/messages',     authorize('student','teacher'), getMessages);
router.post('/sessions/:id/messages',    authorize('student','teacher'), sendMessage);
router.patch('/sessions/:id/save',       authorize('student','teacher'), toggleSave);
router.patch('/sessions/:id/resolve',    authorize('teacher'),           resolveSession);

module.exports = router;