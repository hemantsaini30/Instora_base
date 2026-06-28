const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const generateReceiptNumber = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${dateStr}-${random}`;
};

const updateStudentFeeStatus = async (studentId) => {
  const fees = await Fee.find({ studentId });
  if (fees.length === 0) return;
  const hasPartial = fees.some(f => f.status === 'partial');
  const hasPending = fees.some(f => f.status === 'pending');
  let status = 'paid';
  if (hasPartial || (hasPending && fees.some(f => f.status !== 'pending'))) status = 'partial';
  if (hasPending && fees.every(f => f.status === 'pending')) status = 'pending';
  await Student.findByIdAndUpdate(studentId, { feeStatus: status });
};

// Generate monthly fees for all students in a batch
const generateMonthlyFees = async (req, res, next) => {
  try {
    const { batchId, studentId, amount, month, year } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }
    if (!batchId && !studentId) {
      return res.status(400).json({ success: false, message: 'Either batchId or studentId is required' });
    }

    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();

    // Build student list
    let students = [];
    if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      students = [student];
    } else {
      students = await Student.find({ batchId });
      if (students.length === 0) {
        return res.status(400).json({ success: false, message: 'No students in this batch' });
      }
    }

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      const existing = await Fee.findOne({
        studentId: student._id,
        month: targetMonth,
        year: targetYear,
      });
      if (existing) { skipped++; continue; }
      await Fee.create({
        studentId: student._id,
        batchId: student.batchId,
        amount,
        month: targetMonth,
        year: targetYear,
      });
      created++;
    }

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.status(201).json({
      success: true,
      message: `Generated ${created} fee record${created !== 1 ? 's' : ''} for ${MONTHS[targetMonth - 1]} ${targetYear}. ${skipped > 0 ? `${skipped} already existed.` : ''}`,
      data: { created, skipped, month: targetMonth, year: targetYear }
    });
  } catch (error) {
    next(error);
  }
};

const getAllFees = async (req, res, next) => {
  try {
    const { batchId, status, month, year } = req.query;
    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (status) filter.status = status;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const fees = await Fee.find(filter)
      .populate({ path: 'studentId', select: 'fullName parentPhone', populate: { path: 'userId', select: 'username' } })
      .populate('batchId', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
};

const getMyFees = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const fees = await Fee.find({ studentId: student._id })
      .populate('batchId', 'name')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
};

const getFeeSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const allFees = await Fee.find();
    const thisMonthFees = allFees.filter(f => f.month === currentMonth && f.year === currentYear);

    const totalBilled = allFees.reduce((s, f) => s + f.amount, 0);
    const totalCollected = allFees.reduce((s, f) => s + f.paidAmount, 0);
    const totalPending = totalBilled - totalCollected;

    const thisMonthBilled = thisMonthFees.reduce((s, f) => s + f.amount, 0);
    const thisMonthCollected = thisMonthFees.reduce((s, f) => s + f.paidAmount, 0);

    res.json({
      success: true,
      data: {
        totalBilled, totalCollected, totalPending,
        thisMonthBilled, thisMonthCollected,
        thisMonthPending: thisMonthBilled - thisMonthCollected,
        paid: allFees.filter(f => f.status === 'paid').length,
        pending: allFees.filter(f => f.status === 'pending').length,
        partial: allFees.filter(f => f.status === 'partial').length,
        total: allFees.length,
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteFeeRecord = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    await Payment.deleteMany({ feeId: fee._id });
    res.json({ success: true, message: 'Fee record and related payments deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateMonthlyFees, getAllFees, getMyFees, getFeeSummary, deleteFeeRecord };