const express = require('express');
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { idParam, placementStatusRules } = require('../middleware/validators');
const { uploadStudents, updatePlacementStatus } = require('../controllers/studentController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  '/upload',
  authenticate(),
  authorize('admin'),
  upload.single('file'),
  uploadStudents
);

router.patch(
  '/:id/placement',
  authenticate(),
  authorize('admin'),
  ...idParam,
  ...placementStatusRules,
  updatePlacementStatus
);

module.exports = router;
