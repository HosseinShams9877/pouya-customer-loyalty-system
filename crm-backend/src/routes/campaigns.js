/**
 * Campaign Routes — کمپین‌های بازاریابی
 */

const express = require('express');
const campaignService = require('../services/campaignService');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/campaigns — ایجاد و ارسال کمپین
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { title, message, audienceType } = req.body;

    if (!title || !message || !audienceType) {
      return res.status(400).json({
        success: false,
        message: 'فیلدهای title, message و audienceType الزامی هستند',
      });
    }

    const result = await campaignService.createCampaign({
      title,
      message,
      audienceType,
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[campaigns] خطا در ایجاد کمپین:', error);
    const status = error.message.includes('یافت نشد') ? 404 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
});

// GET /api/v1/campaigns — لیست کمپین‌ها
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const result = await campaignService.listCampaigns({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[campaigns] خطا در لیست:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت کمپین‌ها' });
  }
});

module.exports = router;
