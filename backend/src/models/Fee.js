const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: String, required: true },
  paidDate: { type: String, default: null },
  status: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);