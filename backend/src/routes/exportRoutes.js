const express = require('express');
const {
  exportExcel,
  exportPdf,
  exportStudentReportsPdf,
  exportStudentSingleReportPdf,
} = require('../controllers/exportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/excel', authenticate(), authorize('admin'), exportExcel);
router.get('/pdf', authenticate(), authorize('admin'), exportPdf);
router.get('/student/reports/pdf', authenticate(), authorize('student'), exportStudentReportsPdf);
router.get(
  '/student/reports/:id/pdf',
  authenticate(),
  authorize('student'),
  exportStudentSingleReportPdf
);

module.exports = router;
