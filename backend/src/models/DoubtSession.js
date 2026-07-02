const mongoose = require('mongoose');

const doubtSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  isSavedByStudent: { type: Boolean, default: false },
  isSavedByTeacher: { type: Boolean, default: false },
  lastMessageAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true });

// One thread per student-teacher pair
doubtSessionSchema.index({ studentId: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model('DoubtSession', doubtSessionSchema);