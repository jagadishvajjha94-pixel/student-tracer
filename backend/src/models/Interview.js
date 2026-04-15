const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    resumeLink: { type: String, required: true, trim: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    batch: { type: String, trim: true, default: '' },
    group: { type: String, trim: true, default: '' },
    placementStatus: {
      type: String,
      enum: ['Placed', 'Unplaced'],
      default: 'Unplaced',
    },
    technicalScore: { type: Number, min: 0, max: 10, default: 0 },
    communicationScore: { type: Number, min: 0, max: 10, default: 0 },
    overallScore: { type: Number, min: 0, max: 10, default: 0 },
    interviewType: {
      type: String,
      enum: ['Technical', 'Communication', 'Combined'],
      default: 'Combined',
    },
    score: { type: Number, min: 0, max: 10, default: 0 },
    level: {
      type: String,
      enum: ['Need Improvement', 'Average', 'Good', 'Excellent'],
      required: true,
    },
    remarks: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['Completed', 'Pending', 'Needs Follow-up'],
      default: 'Completed',
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
