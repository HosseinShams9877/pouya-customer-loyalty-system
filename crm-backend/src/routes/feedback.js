const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');

const router = express.Router();

// ════════════════════════════════════════════
// 🔹 روت‌های ادمین (با requireAuth)
// ════════════════════════════════════════════

router.use(requireAuth);

const TYPES = ['COMPLAINT', 'SUGGESTION', 'SURVEY', 'CALL_NOTE'];
const CHANNELS = ['PHONE', 'SMS', 'HEPIKAL', 'WEB', 'IN_PERSON'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

// GET / — لیست بازخوردها
router.get('/', async (req, res) => {
  try {
    await prisma.customerFeedback.updateMany({
      where: {
        dueAt: { lt: new Date() },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        slaBreached: false,
      },
      data: { slaBreached: true },
    });

    const where = {};
    if (req.query.type) where.type = req.query.type;
    if (req.query.status) where.status = req.query.status;
    if (req.query.customerId) where.customerId = req.query.customerId;
    if (req.query.priority) where.priority = req.query.priority;

    const items = await prisma.customerFeedback.findMany({
      where,
      include: {
        customer: {
          select: { id: true, fullName: true, mobile: true, company: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('[feedback/list] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت بازخوردها' });
  }
});

// GET /stats — آمار بازخوردها
router.get('/stats', async (_req, res) => {
  try {
    const [total, open, complaints, suggestions, breached, avg] = await Promise.all([
      prisma.customerFeedback.count(),
      prisma.customerFeedback.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.customerFeedback.count({ where: { type: 'COMPLAINT' } }),
      prisma.customerFeedback.count({ where: { type: 'SUGGESTION' } }),
      prisma.customerFeedback.count({
        where: { slaBreached: true, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.csatToken.aggregate({
        where: { status: 'SUBMITTED' },
        _avg: { score: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        total,
        open,
        complaints,
        suggestions,
        breached,
        csatAverage: avg._avg.score || 0,
      },
    });
  } catch (error) {
    console.error('[feedback/stats] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
  }
});

// POST / — ثبت بازخورد توسط ادمین
router.post('/', async (req, res) => {
  try {
    const type = String(req.body.type || '').toUpperCase();
    const channel = String(req.body.channel || 'PHONE').toUpperCase();

    if (!TYPES.includes(type) || !CHANNELS.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'نوع یا کانال نامعتبر است. مقادیر مجاز: ' + TYPES.join(', '),
      });
    }

    if (!req.body.subject?.trim() || !req.body.description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'عنوان و شرح بازخورد الزامی است',
      });
    }

    const priority = req.body.priority || 'NORMAL';
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'اولویت نامعتبر است. مقادیر مجاز: LOW, NORMAL, HIGH, CRITICAL',
      });
    }

    const slaHours = { LOW: 72, NORMAL: 24, HIGH: 8, CRITICAL: 2 }[priority] || 24;

    const data = await prisma.customerFeedback.create({
      data: {
        customerId: req.body.customerId || null,
        leadId: req.body.leadId || null,
        type,
        channel,
        subject: String(req.body.subject).trim(),
        description: String(req.body.description).trim(),
        score: req.body.score == null ? null : Number(req.body.score),
        priority,
        assignedToId: req.body.assignedToId || req.user.id,
        dueAt: new Date(Date.now() + slaHours * 3600000),
      },
      include: { customer: true },
    });

    return res.status(201).json({
      success: true,
      message: 'بازخورد مشتری ثبت شد',
      data,
    });
  } catch (error) {
    console.error('[feedback/create] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت بازخورد' });
  }
});

// PATCH /:id — بروزرسانی بازخورد (با CSAT خودکار)
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['status', 'priority', 'assignedToId', 'resolution', 'firstResponseAt', 'score'];
    const data = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    if (data.status === 'IN_PROGRESS' && !data.firstResponseAt) {
      data.firstResponseAt = new Date();
    }

    if (['RESOLVED', 'CLOSED'].includes(data.status)) {
      data.resolvedAt = new Date();
    }

    const item = await prisma.customerFeedback.update({
      where: { id: req.params.id },
      data,
      include: { customer: true },
    });

    // ─── 🎯 ارسال خودکار CSAT در صورت حل شدن ───
    if (data.status === 'RESOLVED' && item.customerId) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: item.customerId },
          select: { fullName: true, mobile: true },
        });

        if (customer?.mobile) {
          // ایجاد توکن CSAT
          const csatToken = await prisma.csatToken.create({
            data: {
              customerId: item.customerId,
              interactionId: null,
              leadId: item.leadId || null,
              assignedToId: req.user.id,
              token: crypto.randomUUID(),
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 7 * 86400000), // ۷ روز
            },
          });

          // ارسال پیامک با لینک CSAT
          const csatLink = `${process.env.CSAT_BASE_URL || 'http://localhost:3000/csat'}/${csatToken.token}`;
          const message = `👋 ${customer.fullName} عزیز، مشکل شما حل شد. لطفاً از ۱ تا ۵ به خدمات ما امتیاز دهید:\n${csatLink}`;

          await smsService.sendSMS(customer.mobile, message).catch(() => {});
          console.log(`[feedback] 📨 لینک CSAT برای ${customer.mobile} ارسال شد`);
        }
      } catch (csatError) {
        console.error('[feedback/csat] خطا:', csatError.message);
      }
    }

    return res.json({
      success: true,
      data: item,
      message: 'بازخورد با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('[feedback/update] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در بروزرسانی بازخورد' });
  }
});

// ════════════════════════════════════════════
// 🔹 روت‌های عضو (Member)
// ════════════════════════════════════════════

// GET /member/feedback — تاریخچه بازخوردهای عضو + CSAT
router.get('/member/feedback', requireAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: req.user.id },
          { mobile: req.user.mobile },
        ],
      },
      select: { id: true },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'مشتری یافت نشد' });
    }

    // دریافت بازخوردها همراه با CSAT Token
    const items = await prisma.customerFeedback.findMany({
      where: { customerId: customer.id },
      include: {
        csatTokens: {
          where: { status: 'PENDING' },
          select: {
            token: true,
            expiresAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // اضافه کردن لینک CSAT و وضعیت CSAT
    const result = items.map(item => ({
      ...item,
      csatLink: item.csatTokens.length > 0
        ? `${process.env.CSAT_BASE_URL || 'http://localhost:3000/csat'}/${item.csatTokens[0].token}`
        : null,
      hasPendingCsat: item.csatTokens.length > 0,
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[member/feedback/list] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت بازخوردها' });
  }
});

// POST /member/feedback — ثبت بازخورد توسط عضو
router.post('/member/feedback', requireAuth, async (req, res) => {
  try {
    const { type = 'COMPLAINT', subject, description, channel = 'WEB' } = req.body;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'عنوان و شرح بازخورد الزامی است',
      });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: req.user.id },
          { mobile: req.user.mobile },
        ],
      },
      select: { id: true, fullName: true, mobile: true },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'مشتری یافت نشد',
      });
    }

    const priority = type === 'COMPLAINT' ? 'HIGH' : 'NORMAL';
    const slaHours = { LOW: 72, NORMAL: 24, HIGH: 8, CRITICAL: 2 }[priority] || 24;

    const feedback = await prisma.customerFeedback.create({
      data: {
        customerId: customer.id,
        type,
        channel,
        subject,
        description,
        priority,
        status: 'OPEN',
        dueAt: new Date(Date.now() + slaHours * 3600000),
      },
    });

    // ─── 🔔 نوتیفیکیشن به ادمین‌ها ───
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationService.create({
        type: 'NEW_FEEDBACK',
        title: '📝 بازخورد جدید از مشتری',
        message: `بازخورد "${subject}" توسط ${customer.fullName} ثبت شد`,
        link: '/voice-of-customer',
        userId: admin.id,
        data: { feedbackId: feedback.id, customerId: customer.id },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'بازخورد شما با موفقیت ثبت شد. کارشناسان ما بررسی می‌کنند.',
      data: feedback,
    });
  } catch (error) {
    console.error('[member/feedback/create] خطا:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت بازخورد' });
  }
});

module.exports = router;