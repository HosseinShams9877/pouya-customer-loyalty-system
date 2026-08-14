const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const retentionService = require('../services/retentionService');

const router = express.Router();
router.use(requireAuth);

router.get('/rules', async (_req, res) => res.json({ success: true, data: await retentionService.getRules() }));
router.get('/report', async (_req, res) => res.json({ success: true, data: await retentionService.getReport() }));
router.get('/reactivation', async (req, res) => res.json({ success: true, data: await retentionService.getReactivationWindow(req.query.limit) }));

router.post('/run', requireRole('ADMIN', 'LOYALTY_MANAGER'), async (_req, res) => {
  const data = await retentionService.runRetentionAnalysis();
  return res.json({ success: true, message: 'تحلیل رفتار خرید و هشدارهای ریزش اجرا شد', data });
});

router.post('/reactivation/campaign', requireRole('ADMIN', 'LOYALTY_MANAGER'), async (req, res) => {
  const window = await retentionService.getReactivationWindow(req.body.limit);
  const campaign = await prisma.campaign.create({
    data: {
      title: String(req.body.title || 'کمپین فعال‌سازی مجدد ۲۵۰ مشتری').slice(0, 120),
      message: String(req.body.message || 'برای ادامه همکاری، پیشنهاد اختصاصی شما در باشگاه پویا فعال شد.').slice(0, 500),
      audienceType: 'AT_RISK',
      channels: ['SMS', 'PUSH'],
      status: 'DRAFT',
      totalRecipients: window.count,
      createdBy: req.user.id,
    },
  });
  return res.status(201).json({ success: true, message: `کمپین بازگشت برای ${window.count} مشتری آماده شد`, data: campaign });
});

router.post('/customers/:id/reactivate', async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) return res.status(404).json({ success: false, message: 'مشتری یافت نشد' });
  if (req.user.role === 'SALES_REP' && customer.assignedToId && customer.assignedToId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'این مشتری به کارشناس دیگری تخصیص دارد' });
  }
  const data = await prisma.customer.update({
    where: { id: customer.id },
    data: { status: 'ACTIVE', reactivatedAt: new Date(), lastActivityAt: new Date() },
  });
  return res.json({ success: true, message: 'مشتری به چرخه پیگیری فعال بازگشت', data });
});

module.exports = router;
