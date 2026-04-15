const express = require('express');
const {
  createInterview,
  listInterviewsAdmin,
  getByStudentRoll,
  getByInterviewer,
  searchStudents,
} = require('../controllers/interviewController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createInterviewRules,
  rollParam,
  idParam,
} = require('../middleware/validators');

const router = express.Router();

router.post(
  '/',
  authenticate(),
  authorize('interviewer'),
  ...createInterviewRules,
  createInterview
);

router.get(
  '/',
  authenticate(),
  authorize('admin'),
  listInterviewsAdmin
);

router.get(
  '/student/:rollNumber',
  authenticate(),
  authorize('admin', 'student', 'interviewer'),
  ...rollParam,
  getByStudentRoll
);

router.get(
  '/search',
  authenticate(),
  authorize('admin', 'interviewer'),
  searchStudents
);

router.get(
  '/interviewer/:id',
  authenticate(),
  authorize('admin', 'interviewer'),
  ...idParam,
  getByInterviewer
);

module.exports = router;
