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

// All lead routes require auth
router.use(requireAuth);

// ════════════════════════════════════════════
// GET / — List leads
// SALES_REP: only own leads. ADMIN: all.
// Query params: stage, search, page, pageSize
// ════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { stage, search, page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 20));
    const skip = (pageNum - 1) * sizeNum;

    const where = {};

    // Stage filter
    if (stage) {
      where.stage = stage;
    }

    // Search filter (fullName or mobile or company)
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
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          project: {
            select: { id: true, title: true },
          },
          _count: {
            select: { interactions: true },
          },
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
// GET /stats/pipeline — leads per stage
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
        const count = await prisma.lead.count({
          where: { ...where, stage },
        });
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
// GET /:id — Get single lead with interactions
// ════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, title: true, city: true, status: true },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'سرنخ یافت نشد',
      });
    }

    // SALES_REP can only see their own leads
    if (req.user.role === 'SALES_REP' && lead.assignedToId && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این سرنخ ندارید',
      });
    }

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/get] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// POST / — Create lead
// SALES_REP auto-set assignedToId to current user
// ════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { fullName, mobile, company, source, stage, estimatedValue, projectId, productType, description, assignedToId, assignedToName, lostReason, competitorName, customerType, province, expectedDecisionAt } = req.body;

    if (!fullName || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'نام و شماره موبایل الزامی است',
      });
    }

    // Parse BigInt fields
    const parsed = parseBigIntFields(
      { estimatedValue, competitorPrice: req.body.competitorPrice },
      ['estimatedValue', 'competitorPrice']
    );
    if (stage === 'LOST' && (!lostReason || !parsed.competitorPrice || parsed.competitorPrice <= 0n)) {
      return res.status(400).json({ success: false, message: 'برای فروش از دست‌رفته، دلیل باخت و قیمت رقیب الزامی است' });
    }

    // SALES_REP auto-set assignedToId
    let finalAssignedToId = assignedToId;
    let finalAssignedToName = assignedToName;

    if (req.user.role === 'SALES_REP') {
      finalAssignedToId = req.user.id;
      finalAssignedToName = `${req.user.firstName} ${req.user.lastName}`;
    } else if (finalAssignedToId) {
      // ADMIN: look up the assigned user's name
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
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/create] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// PATCH /:id — Update lead fields
// Only ADMIN can change assignedToId
// ════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName, mobile, company, source, stage,
      estimatedValue, projectId, productType, description,
      assignedToId, assignedToName, competitorPrice,
      lostReason, competitorName, customerType, province, expectedDecisionAt,
    } = req.body;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'سرنخ یافت نشد',
      });
    }

    // SALES_REP can only update their own leads
    if (req.user.role === 'SALES_REP' && existing.assignedToId && existing.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'شما فقط می‌توانید سرنخ‌های خود را ویرایش کنید',
      });
    }

    // Build update data
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

    // BigInt fields
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
        // Look up name
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
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/update] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// PATCH /:id/stage — Change lead stage
// If stage=LOST, require lostReason in body
// ════════════════════════════════════════════
router.patch('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, lostReason, competitorPrice, competitorName } = req.body;

    if (!stage || !['INQUIRY', 'CONSULTING', 'PROFORMA', 'WON', 'LOST'].includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'مرحله نامعتبر است. مقادیر مجاز: INQUIRY, CONSULTING, PROFORMA, WON, LOST',
      });
    }

    let parsedCompetitorPrice = null;
    if (stage === 'LOST') {
      parsedCompetitorPrice = parseBigIntFields({ competitorPrice }, ['competitorPrice']).competitorPrice;
    }
    if (stage === 'LOST' && (!lostReason || !parsedCompetitorPrice || parsedCompetitorPrice <= 0n)) {
      return res.status(400).json({
        success: false,
        message: 'در صورت ثبت باخت، دلیل باخت و قیمت رقیب الزامی است',
      });
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'سرنخ یافت نشد',
      });
    }

    // SALES_REP can only update their own leads
    if (req.user.role === 'SALES_REP' && existing.assignedToId && existing.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'شما فقط می‌توانید سرنخ‌های خود را ویرایش کنید',
      });
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

    // Ensure assignedToName is set
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
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('[leads/stage] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
