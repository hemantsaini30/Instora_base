const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' },
  generatedDate: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { timestamps: true });

feeSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);