/**
 * Interaction Routes
 * 
 * - POST   /leads/:leadId  — create interaction
 * - GET    /leads/:leadId  — list interactions for a lead
 * - GET    /upcoming       — upcoming follow-ups for current user's leads
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const csatService = require('../services/csatService');
const notificationService = require('../services/notificationService');

// All routes require auth
router.use(requireAuth);

// ════════════════════════════════════════════
// POST /leads/:leadId — Create interaction
// ════════════════════════════════════════════
router.post('/leads/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const { type, description, nextFollowUpDate } = req.body;

    if (!type || !description) {
      return res.status(400).json({ success: false, message: 'نوع و توضیحات تعامل الزامی است' });
    }

    if (!['CALL', 'MEETING', 'MESSAGE'].includes(type)) {
      return res.status(400).json({ success: false, message: 'نوع تعامل نامعتبر است. مقادیر مجاز: CALL, MEETING, MESSAGE' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && lead.assignedToId && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما دسترسی به این سرنخ ندارید' });
    }

    const interaction = await prisma.interaction.create({
      data: {
        leadId,
        type,
        description,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      },
    });

    // ─── 🔔 نوتیفیکیشن پیگیری ───
    if (nextFollowUpDate) {
      // 1. به کارشناس فروش (اگه تخصیص داده شده)
      if (lead.assignedToId) {
        await notificationService.create({
          type: notificationService.NOTIFICATION_TYPES.FOLLOWUP_DUE,
          title: '⏰ زمان پیگیری',
          message: `زمان پیگیری سرنخ "${lead.fullName}" رسیده است`,
          link: `/leads/${leadId}`,
          userId: lead.assignedToId,
          data: { leadId, followUpDate: nextFollowUpDate },
        });
      }
      
      // 2. به ادمین‌ها (اگه سرنخ به کسی تخصیص داده نشده)
      if (!lead.assignedToId) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', status: 'ACTIVE' },
          select: { id: true },
        });
        for (const admin of admins) {
          await notificationService.create({
            type: notificationService.NOTIFICATION_TYPES.FOLLOWUP_DUE,
            title: '⏰ زمان پیگیری (بدون تخصیص)',
            message: `زمان پیگیری سرنخ "${lead.fullName}" رسیده است. لطفاً یک کارشناس تخصیص دهید.`,
            link: `/leads/${leadId}`,
            userId: admin.id,
            data: { leadId, followUpDate: nextFollowUpDate },
          });
        }
      }
    }

    let csat = null;
    if (type === 'CALL') {
      let customer = await prisma.customer.findUnique({ where: { mobile: lead.mobile } });
      if (!customer) {
        const baseTier = await prisma.loyaltyTier.findFirst({
          where: { isActive: true, audienceType: { in: ['CONTRACTOR', 'ALL'] } },
          orderBy: { minPoints: 'asc' },
        });
        customer = await prisma.customer.create({
          data: {
            fullName: lead.fullName,
            mobile: lead.mobile,
            company: lead.company,
            customerType: 'CONTRACTOR',
            assignedToId: lead.assignedToId || req.user.id,
            tierId: baseTier?.id || null,
          },
        });
      } else if (!customer.assignedToId && (lead.assignedToId || req.user.id)) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { assignedToId: lead.assignedToId || req.user.id },
        });
      }
      csat = await csatService.createCsatToken({
        interactionId: interaction.id,
        customerId: customer.id,
        customerName: customer.fullName,
        customerMobile: customer.mobile,
        leadId: lead.id,
        assignedToId: lead.assignedToId || req.user.id,
      }).catch((error) => ({ error: error.message }));
    }

    res.status(201).json({
      success: true,
      message: type === 'CALL' ? 'تماس ثبت و نظرسنجی رضایت ارسال شد' : 'تعامل ثبت شد',
      data: { ...interaction, csat },
    });
  } catch (err) {
    console.error('[interactions/create] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// GET /leads/:leadId — List interactions for a lead
// ════════════════════════════════════════════
router.get('/leads/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && lead.assignedToId && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما دسترسی به این سرنخ ندارید' });
    }

    const interactions = await prisma.interaction.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: interactions });
  } catch (err) {
    console.error('[interactions/list] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// GET /upcoming — Interactions with nextFollowUpDate >= now
// for current user's assigned leads
// ════════════════════════════════════════════
router.get('/upcoming', async (req, res) => {
  try {
    const now = new Date();

    const leadWhere = {};
    if (req.user.role === 'SALES_REP') {
      leadWhere.assignedToId = req.user.id;
    }

    const userLeads = await prisma.lead.findMany({
      where: leadWhere,
      select: { id: true },
    });
    const leadIds = userLeads.map((l) => l.id);

    if (leadIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const interactions = await prisma.interaction.findMany({
      where: {
        leadId: { in: leadIds },
        nextFollowUpDate: { gte: now },
      },
      include: {
        lead: {
          select: { id: true, fullName: true, mobile: true, stage: true },
        },
      },
      orderBy: { nextFollowUpDate: 'asc' },
    });

    res.json({ success: true, data: interactions });
  } catch (err) {
    console.error('[interactions/upcoming] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;