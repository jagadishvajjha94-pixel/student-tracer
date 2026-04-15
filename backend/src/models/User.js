const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'interviewer', 'student'],
      required: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
    expertise: { type: String, trim: true, default: '' },
    batch: { type: String, trim: true, default: '', index: true },
    group: { type: String, trim: true, default: '', index: true },
    skills: { type: [String], default: [] },
    contactNumber: { type: String, trim: true, default: '' },
    placementStatus: {
      type: String,
      enum: ['Placed', 'Unplaced'],
      default: 'Unplaced',
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
