const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const markAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;
    if (!batchId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'batchId, date and records are required' });
    }

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, date },
        update: { $set: { studentId, batchId, date, status, markedBy: req.user.id } },
        upsert: true,
      }
    }));

    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: 'Attendance saved successfully' });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByBatchAndDate = async (req, res, next) => {
  try {
    const { batchId, date } = req.query;
    if (!batchId || !date) {
      return res.status(400).json({ success: false, message: 'batchId and date are required' });
    }
    const records = await Attendance.find({ batchId, date })
      .populate('studentId', 'fullName');
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ studentId }).sort({ date: -1 });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    res.json({ success: true, data: { records, total, present, absent: total - present, percentage } });
  } catch (error) {
    next(error);
  }
};

const getBatchAttendanceSummary = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const students = await Student.find({ batchId }).populate('userId', 'username');
    const summary = await Promise.all(students.map(async (student) => {
      const records = await Attendance.find({ studentId: student._id });
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
      return {
        studentId: student._id,
        fullName: student.fullName,
        username: student.userId?.username,
        total, present,
        absent: total - present,
        percentage,
      };
    }));
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const getDatewiseAttendance = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const records = await Attendance.find({ batchId }).sort({ date: 1 });

    const dateMap = {};
    records.forEach(r => {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, present: 0, absent: 0 };
      }
      if (r.status === 'present') dateMap[r.date].present++;
      else dateMap[r.date].absent++;
    });

    const data = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByBatchAndDate,
  getAttendanceByStudent,
  getDatewiseAttendance,
  getBatchAttendanceSummary,
};