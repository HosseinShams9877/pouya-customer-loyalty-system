const express = require('express');
const { getDashboardData } = require('../services/ceoDashboardService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/stats/ceo-dashboard
router.get('/ceo-dashboard', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = await getDashboardData();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[stats] خطا در ceo-dashboard:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
  }
});

module.exports = router;
