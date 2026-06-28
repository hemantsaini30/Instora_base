const Fee = require('../models/Fee');
const Student = require('../models/Student');

const createFeeRecord = async (req, res, next) => {
  try {
    const { studentId, batchId, amount, dueDate, note } = req.body;
    if (!studentId || !batchId || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'studentId, batchId, amount and dueDate are required' });
    }
    const fee = await Fee.create({ studentId, batchId, amount, dueDate, note });
    const populated = await Fee.findById(fee._id)
      .populate({ path: 'studentId', select: 'fullName', populate: { path: 'userId', select: 'username' } })
      .populate('batchId', 'name');
    res.status(201).json({ success: true, message: 'Fee record created', data: populated });
  } catch (error) {
    next(error);
  }
};

const getAllFees = async (req, res, next) => {
  try {
    const { batchId, status } = req.query;
    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (status) filter.status = status;
    const fees = await Fee.find(filter)
      .populate({ path: 'studentId', select: 'fullName parentPhone', populate: { path: 'userId', select: 'username' } })
      .populate('batchId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const { paidAmount, paidDate, note } = req.body;
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }
    fee.paidAmount = paidAmount;
    fee.paidDate = paidDate || new Date().toISOString().split('T')[0];
    if (note) fee.note = note;
    if (paidAmount >= fee.amount) {
      fee.status = 'paid';
    } else if (paidAmount > 0) {
      fee.status = 'partial';
    } else {
      fee.status = 'pending';
    }
    await fee.save();

    await Student.findByIdAndUpdate(fee.studentId, { feeStatus: fee.status });

    const populated = await Fee.findById(fee._id)
      .populate({ path: 'studentId', select: 'fullName', populate: { path: 'userId', select: 'username' } })
      .populate('batchId', 'name');
    res.json({ success: true, message: 'Payment recorded', data: populated });
  } catch (error) {
    next(error);
  }
};

const getFeeSummary = async (req, res, next) => {
  try {
    const fees = await Fee.find();
    const totalDue = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalPending = totalDue - totalCollected;
    const paid = fees.filter(f => f.status === 'paid').length;
    const pending = fees.filter(f => f.status === 'pending').length;
    const partial = fees.filter(f => f.status === 'partial').length;
    res.json({
      success: true,
      data: { totalDue, totalCollected, totalPending, paid, pending, partial, total: fees.length }
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
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (error) {
    next(error);
  }
};

const getMyFees = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const fees = await Fee.find({ studentId: student._id })
      .populate('batchId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFeeRecord, getAllFees, recordPayment, getFeeSummary, deleteFeeRecord, getMyFees };