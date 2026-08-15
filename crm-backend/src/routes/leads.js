/**
 * Leads CRUD Routes
 * 
 * BigInt fields (estimatedValue, competitorPrice) handled via parseBigIntFields.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { parseBigIntFields } = require('../lib/bigint');
const { requireAuth, requireRole } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

function getStageLabel(stage) {
  const stageMap = {
    'INQUIRY': 'استعلام',
    'CONSULTING': 'مشاوره',
    'PROFORMA': 'پیش‌فاکتور',
    'WON': 'موفق',
    'LOST': 'از دست رفته',
  };
  return stageMap[stage] || stage;
}

// All lead routes require auth
router.use(requireAuth);

// ════════════════════════════════════════════
// GET / — List leads
// ════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { stage, search, page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 20));
    const skip = (pageNum - 1) * sizeNum;

    const where = {};

    if (stage) where.stage = stage;

    if (search && search.trim()) {
      where.OR = [
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
        { mobile: { contains: search.trim() } },
        { company: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // SALES_REP sees only their own leads
    if (req.user.role === 'SALES_REP') {
      where.assignedToId = req.user.id;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, title: true } },
          customer: { select: { id: true, fullName: true, mobile: true, status: true } },
          _count: { select: { interactions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: sizeNum,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (err) {
    console.error('[leads/list] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// GET /stats/pipeline
// ════════════════════════════════════════════
router.get('/stats/pipeline', async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'SALES_REP') {
      where.assignedToId = req.user.id;
    }

    const stages = ['INQUIRY', 'CONSULTING', 'PROFORMA', 'WON', 'LOST'];
    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.lead.count({ where: { ...where, stage } });
        return { stage, count };
      })
    );

    const total = pipeline.reduce((sum, s) => sum + s.count, 0);

    res.json({
      success: true,
      data: { pipeline, total },
    });
  } catch (err) {
    console.error('[leads/pipeline] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// GET /:id
// ════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, title: true, city: true, status: true } },
        customer: { select: { id: true, fullName: true, mobile: true, status: true } },
        interactions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && lead.assignedToId && lead.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما دسترسی به این سرنخ ندارید' });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/get] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// POST / — Create lead
// ════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { fullName, mobile, company, source, stage, estimatedValue, projectId, productType, description, assignedToId, assignedToName, lostReason, competitorName, customerType, province, expectedDecisionAt } = req.body;

    if (!fullName || !mobile) {
      return res.status(400).json({ success: false, message: 'نام و شماره موبایل الزامی است' });
    }

    const parsed = parseBigIntFields(
      { estimatedValue, competitorPrice: req.body.competitorPrice },
      ['estimatedValue', 'competitorPrice']
    );
    if (stage === 'LOST' && (!lostReason || !parsed.competitorPrice || parsed.competitorPrice <= 0n)) {
      return res.status(400).json({ success: false, message: 'برای فروش از دست‌رفته، دلیل باخت و قیمت رقیب الزامی است' });
    }

    let finalAssignedToId = assignedToId;
    let finalAssignedToName = assignedToName;

    if (req.user.role === 'SALES_REP') {
      finalAssignedToId = req.user.id;
      finalAssignedToName = `${req.user.firstName} ${req.user.lastName}`;
    } else if (finalAssignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
        select: { firstName: true, lastName: true },
      });
      if (assignedUser) {
        finalAssignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        fullName,
        mobile,
        company: company || null,
        source: source || 'walk_in',
        stage: stage || 'INQUIRY',
        estimatedValue: parsed.estimatedValue || BigInt(0),
        projectId: projectId || null,
        productType: productType || null,
        description: description || null,
        lostReason: stage === 'LOST' ? lostReason : null,
        competitorPrice: parsed.competitorPrice || null,
        competitorName: stage === 'LOST' ? competitorName || null : null,
        customerType: customerType || null,
        province: province || null,
        expectedDecisionAt: expectedDecisionAt ? new Date(expectedDecisionAt) : null,
        assignedToId: finalAssignedToId || null,
        assignedToName: finalAssignedToName || null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // ─── 🔔 نوتیفیکیشن ───
    if (finalAssignedToId) {
      await notificationService.create({
        type: notificationService.NOTIFICATION_TYPES.NEW_LEAD,
        title: '🆕 سرنخ جدید',
        message: `سرنخ جدید "${fullName}" به شما تخصیص داده شد`,
        link: `/leads/${lead.id}`,
        userId: finalAssignedToId,
        data: { leadId: lead.id, fullName, mobile },
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    for (const admin of admins) {
      await notificationService.create({
        type: notificationService.NOTIFICATION_TYPES.NEW_LEAD,
        title: '🆕 سرنخ جدید ثبت شد',
        message: `سرنخ جدید "${fullName}" توسط ${req.user.firstName} ${req.user.lastName} ثبت شد`,
        link: `/leads/${lead.id}`,
        userId: admin.id,
        data: { leadId: lead.id, fullName, mobile, createdBy: req.user.id },
      });
    }

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/create] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// PATCH /:id — Update lead fields
// ════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile, company, source, stage, estimatedValue, projectId, productType, description, assignedToId, assignedToName, competitorPrice, lostReason, competitorName, customerType, province, expectedDecisionAt } = req.body;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && existing.assignedToId && existing.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما فقط می‌توانید سرنخ‌های خود را ویرایش کنید' });
    }

    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (mobile !== undefined) data.mobile = mobile;
    if (company !== undefined) data.company = company;
    if (source !== undefined) data.source = source;
    if (stage !== undefined) data.stage = stage;
    if (projectId !== undefined) data.projectId = projectId;
    if (productType !== undefined) data.productType = productType;
    if (description !== undefined) data.description = description;
    if (lostReason !== undefined) data.lostReason = lostReason;
    if (competitorName !== undefined) data.competitorName = competitorName || null;
    if (customerType !== undefined) data.customerType = customerType || null;
    if (province !== undefined) data.province = province || null;
    if (expectedDecisionAt !== undefined) data.expectedDecisionAt = expectedDecisionAt ? new Date(expectedDecisionAt) : null;

    const finalStage = stage ?? existing.stage;
    const finalLostReason = lostReason ?? existing.lostReason;
    const finalCompetitorPrice = competitorPrice ?? existing.competitorPrice;
    if (finalStage === 'LOST' && (!finalLostReason || !finalCompetitorPrice || BigInt(finalCompetitorPrice) <= 0n)) {
      return res.status(400).json({ success: false, message: 'برای فروش از دست‌رفته، دلیل باخت و قیمت رقیب الزامی است' });
    }

    if (estimatedValue !== undefined || competitorPrice !== undefined) {
      const parsed = parseBigIntFields(
        { estimatedValue: estimatedValue ?? existing.estimatedValue, competitorPrice: competitorPrice ?? existing.competitorPrice },
        ['estimatedValue', 'competitorPrice']
      );
      if (estimatedValue !== undefined) data.estimatedValue = parsed.estimatedValue;
      if (competitorPrice !== undefined) data.competitorPrice = parsed.competitorPrice;
    }

    // Only ADMIN can change assignedToId
    if (req.user.role === 'ADMIN') {
      if (assignedToId !== undefined) {
        data.assignedToId = assignedToId;
        if (assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { firstName: true, lastName: true },
          });
          if (assignedUser) {
            data.assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
          }
        } else {
          data.assignedToName = null;
        }
      }
    }

    if (assignedToName !== undefined && req.user.role === 'ADMIN') {
      data.assignedToName = assignedToName;
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, title: true } },
        customer: { select: { id: true, fullName: true, mobile: true, status: true } },
      },
    });

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/update] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// DELETE /:id
// ════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && existing.assignedToId && existing.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما فقط می‌توانید سرنخ‌های خود را حذف کنید' });
    }

    await prisma.lead.delete({ where: { id } });
    res.json({ success: true, message: 'سرنخ با موفقیت حذف شد' });
  } catch (err) {
    console.error('[leads/delete] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// PATCH /:id/stage — Change lead stage
// ════════════════════════════════════════════
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, lostReason, competitorPrice, competitorName } = req.body;

    if (!stage || !['INQUIRY', 'CONSULTING', 'PROFORMA', 'WON', 'LOST'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'مرحله نامعتبر است. مقادیر مجاز: INQUIRY, CONSULTING, PROFORMA, WON, LOST' });
    }

    let parsedCompetitorPrice = null;
    if (stage === 'LOST') {
      parsedCompetitorPrice = parseBigIntFields({ competitorPrice }, ['competitorPrice']).competitorPrice;
    }
    if (stage === 'LOST' && (!lostReason || !parsedCompetitorPrice || parsedCompetitorPrice <= 0n)) {
      return res.status(400).json({ success: false, message: 'در صورت ثبت باخت، دلیل باخت و قیمت رقیب الزامی است' });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرنخ یافت نشد' });
    }

    if (req.user.role === 'SALES_REP' && existing.assignedToId && existing.assignedToId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'شما فقط می‌توانید سرنخ‌های خود را ویرایش کنید' });
    }

    // 🎯 تبدیل سرنخ به مشتری در صورت WON
    let customer = null;
    if (stage === 'WON' && existing.stage !== 'WON') {
      customer = await prisma.customer.findUnique({ where: { mobile: existing.mobile } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            fullName: existing.fullName,
            mobile: existing.mobile,
            company: existing.company || '',
            status: 'ACTIVE',
            city: existing.province || '',
            customerType: existing.customerType || 'CONTRACTOR',
            totalPurchase: existing.estimatedValue || 0,
            invoicesCount: 0,
            totalPoints: 0,
            walletBalance: 0,
          },
        });
        console.log(`✅ سرنخ ${existing.fullName} به مشتری تبدیل شد (ID: ${customer.id})`);
      } else {
        console.log(`ℹ️ مشتری با موبایل ${existing.mobile} قبلاً وجود داشت`);
      }
    }

    const data = { stage };
    if (stage === 'LOST') {
      data.lostReason = lostReason;
      data.competitorPrice = parsedCompetitorPrice;
      data.competitorName = competitorName || null;
    } else {
      data.lostReason = null;
      data.competitorPrice = null;
      data.competitorName = null;
    }

    if (customer) {
      data.customerId = customer.id;
    }

    if (!existing.assignedToName && existing.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: existing.assignedToId },
        select: { firstName: true, lastName: true },
      });
      if (assignedUser) {
        data.assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`;
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, title: true } },
        customer: { select: { id: true, fullName: true, mobile: true, status: true } },
      },
    });

    // ─── 🔔 نوتیفیکیشن ───
    const stageLabel = getStageLabel(stage);
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    // 1. به کارشناس فروش (اگه تخصیص داده شده)
    if (lead.assignedToId) {
      await notificationService.create({
        type: notificationService.NOTIFICATION_TYPES.LEAD_STAGE_CHANGE,
        title: '📌 تغییر مرحله سرنخ',
        message: `مرحله سرنخ "${lead.fullName}" به "${stageLabel}" تغییر کرد`,
        link: `/leads/${lead.id}`,
        userId: lead.assignedToId,
        data: { leadId: lead.id, oldStage: existing.stage, newStage: stage },
      });
    }

    // 2. به ادمین‌ها (همیشه)
    for (const admin of admins) {
      await notificationService.create({
        type: notificationService.NOTIFICATION_TYPES.LEAD_STAGE_CHANGE,
        title: `📌 تغییر مرحله سرنخ به ${stageLabel}`,
        message: `مرحله سرنخ "${lead.fullName}" توسط ${req.user.firstName} ${req.user.lastName} به "${stageLabel}" تغییر کرد`,
        link: `/leads/${lead.id}`,
        userId: admin.id,
        data: { leadId: lead.id, oldStage: existing.stage, newStage: stage, changedBy: req.user.id },
      });
    }

    // 3. اگر WON شد
    if (stage === 'WON' && existing.stage !== 'WON') {
      for (const admin of admins) {
        await notificationService.create({
          type: notificationService.NOTIFICATION_TYPES.LEAD_WON,
          title: '🎉 سرنخ موفق شد',
          message: `سرنخ "${lead.fullName}" با موفقیت به مرحله WON رسید`,
          link: `/leads/${lead.id}`,
          userId: admin.id,
          data: { leadId: lead.id, fullName: lead.fullName },
        });
      }
    }

    // 4. اگر LOST شد
    if (stage === 'LOST' && existing.stage !== 'LOST') {
      for (const admin of admins) {
        await notificationService.create({
          type: notificationService.NOTIFICATION_TYPES.LEAD_LOST,
          title: '⚠️ سرنخ از دست رفت',
          message: `سرنخ "${lead.fullName}" با دلیل "${lostReason}" از دست رفت`,
          link: `/leads/${lead.id}`,
          userId: admin.id,
          data: { leadId: lead.id, fullName: lead.fullName, lostReason },
        });
      }
    }

    res.json({
      success: true,
      data: lead,
      message: customer ? '✅ سرنخ با موفقیت به مشتری تبدیل شد' : 'مرحله سرنخ بروزرسانی شد',
    });
  } catch (err) {
    console.error('[leads/stage] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;