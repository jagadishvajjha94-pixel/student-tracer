const express = require('express');
const { dashboard, leaderboard } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate(), authorize('admin', 'interviewer'), dashboard);
router.get('/leaderboard', authenticate(), authorize('admin'), leaderboard);

module.exports = router;
