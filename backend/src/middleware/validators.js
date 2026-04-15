const { body, param } = require('express-validator');

const emailLike = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role').isIn(['interviewer', 'student']).withMessage('Invalid role'),
  body('rollNumber')
    .if((value, { req }) => req.body.role === 'student')
    .trim()
    .notEmpty()
    .withMessage('Roll number is required for students'),
  body('email').custom((value, { req }) => {
    const role = req.body.role;
    if (role === 'interviewer') {
      if (value == null || !String(value).trim()) {
        throw new Error('Email is required for interviewer');
      }
      if (!emailLike(value)) {
        throw new Error('Invalid email');
      }
    }
    if (role === 'student' && value != null && String(value).trim()) {
      if (!emailLike(value)) {
        throw new Error('Invalid email');
      }
    }
    return true;
  }),
  body('expertise')
    .if((value, { req }) => req.body.role === 'interviewer')
    .optional({ values: 'falsy' })
    .trim(),
];

const loginRules = [
  body('password').notEmpty().withMessage('Password is required'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email'),
  body('rollNumber').optional({ checkFalsy: true }).trim(),
  body().custom((value, { req }) => {
    if (!req.body.rollNumber?.trim() && !req.body.email?.trim()) {
      throw new Error('Provide email or roll number');
    }
    return true;
  }),
];

function normalizeResumeUrl(value) {
  const v = value.trim();
  if (!v) return v;
  try {
    return new URL(v).href;
  } catch {
    try {
      return new URL(`https://${v}`).href;
    } catch {
      return null;
    }
  }
}

const createInterviewRules = [
  body('studentName').trim().notEmpty().withMessage('Student name is required'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('resumeLink')
    .trim()
    .notEmpty()
    .withMessage('Resume link is required')
    .custom((value) => {
      const href = normalizeResumeUrl(value);
      if (!href) throw new Error('Valid resume URL is required');
      return true;
    }),
  body('interviewType')
    .optional()
    .isIn(['Technical', 'Communication', 'Combined'])
    .withMessage('Interview type must be Technical, Communication or Combined'),
  body('technicalScore')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Technical score must be between 0 and 10'),
  body('communicationScore')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Communication score must be between 0 and 10'),
  body('level')
    .optional()
    .isIn(['Need Improvement', 'Average', 'Good', 'Excellent'])
    .withMessage('Invalid level'),
  body('batch').optional().trim(),
  body('group').optional().trim(),
  body('status')
    .optional()
    .isIn(['Completed', 'Pending', 'Needs Follow-up'])
    .withMessage('Invalid interview status'),
  body('remarks').optional().trim(),
];

const rollParam = [
  param('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid id')];

const placementStatusRules = [
  body('placementStatus')
    .isIn(['Placed', 'Unplaced'])
    .withMessage('Placement status must be Placed or Unplaced'),
];

module.exports = {
  registerRules,
  loginRules,
  createInterviewRules,
  rollParam,
  idParam,
  placementStatusRules,
  normalizeResumeUrl,
};
