const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculateShippingBenefit } = require('../services/businessService');

const router = express.Router();
router.use(requireAuth);

const text = (value, max = 160) => String(value || '').trim().slice(0, max);
const bigint = (value) => {
  try { return BigInt(value || 0); } catch { return 0n; }
};

router.get('/dashboard', async (_req, res) => {
  const [leads, invoices, customers, projects, targets, openRequests, shipments] = await Promise.all([
    prisma.lead.findMany({ select: { source: true, stage: true, estimatedValue: true, province: true, customerType: true, createdAt: true } }),
    prisma.invoice.findMany({ select: { amount: true, paymentType: true, createdAt: true } }),
    prisma.customer.findMany({ select: { province: true, status: true, memberStatus: true, customerType: true } }),
    prisma.project.findMany({ select: { city: true, status: true, budget: true, createdAt: true } }),
    prisma.salesTarget.findMany({ orderBy: [{ period: 'desc' }, { scopeType: 'asc' }], take: 12 }),
    prisma.purchaseRequest.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTED'] } } }),
    prisma.shipment.aggregate({ _sum: { transportCost: true, benefitAmount: true, pointsUsed: true }, _count: true }),
  ]);

  const sourceMap = new Map();
  for (const lead of leads) {
    const key = lead.source || 'unknown';
    const row = sourceMap.get(key) || { source: key, total: 0, won: 0, lost: 0, pipelineValue: 0n };
    row.total += 1;
    if (lead.stage === 'WON') row.won += 1;
    if (lead.stage === 'LOST') row.lost += 1;
    row.pipelineValue += BigInt(lead.estimatedValue || 0);
    sourceMap.set(key, row);
  }
  const sourcePerformance = [...sourceMap.values()].map((row) => ({ ...row, conversionRate: row.total ? Math.round(row.won / row.total * 1000) / 10 : 0 }));

  const seasonal = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, sales: 0n, invoices: 0 }));
  for (const invoice of invoices) {
    const row = seasonal[new Date(invoice.createdAt).getMonth()];
    row.sales += BigInt(invoice.amount || 0); row.invoices += 1;
  }

  const provinceMap = new Map();
  for (const customer of customers) {
    const key = customer.province || 'نامشخص';
    provinceMap.set(key, (provinceMap.get(key) || 0) + 1);
  }

  const totalSales = invoices.reduce((sum, item) => sum + BigInt(item.amount || 0), 0n);
  const cashSales = invoices.filter(item => item.paymentType === 'CASH').reduce((sum, item) => sum + BigInt(item.amount || 0), 0n);
  return res.json({ success: true, data: {
    kpis: {
      customers: customers.length,
      activeCustomers: customers.filter(item => item.memberStatus === 'ACTIVE' && item.status === 'ACTIVE').length,
      contractors: customers.filter(item => ['CONTRACTOR', 'END_CUSTOMER'].includes(item.customerType)).length,
      projects: projects.length,
      openRequests,
      totalSales,
      cashShare: totalSales ? Math.round(Number(cashSales * 1000n / totalSales)) / 10 : 0,
      transportCost: shipments._sum.transportCost || 0n,
      transportBenefit: shipments._sum.benefitAmount || 0n,
    },
    sourcePerformance,
    seasonal,
    geography: [...provinceMap.entries()].map(([province, count]) => ({ province, count })).sort((a, b) => b.count - a.count),
    targets,
    questionnaireBaseline: { registeredCustomers: 400, activeCustomers: 150, directShare: 20, representativeShare: 30, projectShare: 50, peakSeason: 'تابستان' },
  } });
});

router.get('/products', async (_req, res) => {
  const data = await prisma.productCatalog.findMany({ orderBy: [{ isActive: 'desc' }, { title: 'asc' }] });
  return res.json({ success: true, data });
});

router.post('/products', requireRole('ADMIN', 'LOYALTY_MANAGER'), async (req, res) => {
  if (!text(req.body.code, 32) || !text(req.body.title)) return res.status(400).json({ success: false, message: 'کد و نام محصول الزامی است' });
  const data = await prisma.productCatalog.create({ data: {
    code: text(req.body.code, 32).toUpperCase(), title: text(req.body.title), category: text(req.body.category, 32) || 'OTHER',
    densityMin: req.body.densityMin == null ? null : Number(req.body.densityMin), densityMax: req.body.densityMax == null ? null : Number(req.body.densityMax),
    dimensions: req.body.dimensions || null, basePrice: bigint(req.body.basePrice), priceUnit: text(req.body.priceUnit, 24) || 'ریال', isActive: req.body.isActive !== false,
  } });
  return res.status(201).json({ success: true, message: 'محصول به کاتالوگ اضافه شد', data });
});

router.get('/price-rules', async (_req, res) => {
  const data = await prisma.priceRule.findMany({ orderBy: [{ isActive: 'desc' }, { ruleType: 'asc' }] });
  return res.json({ success: true, data });
});

router.post('/price-rules', requireRole('ADMIN'), async (req, res) => {
  if (!text(req.body.code, 32) || !text(req.body.title)) return res.status(400).json({ success: false, message: 'کد و عنوان قانون الزامی است' });
  const data = await prisma.priceRule.create({ data: {
    code: text(req.body.code, 32).toUpperCase(), title: text(req.body.title), ruleType: text(req.body.ruleType, 32) || 'VOLUME', audienceType: text(req.body.audienceType, 32) || 'ALL',
    minAmount: bigint(req.body.minAmount), discountPercent: Math.max(0, Math.min(100, Number(req.body.discountPercent) || 0)), maxDiscountRial: req.body.maxDiscountRial == null ? null : bigint(req.body.maxDiscountRial),
    approvalRequired: Boolean(req.body.approvalRequired), conditions: req.body.conditions || null, isActive: req.body.isActive !== false,
  } });
  return res.status(201).json({ success: true, message: 'قانون قیمت و تخفیف ثبت شد', data });
});

router.get('/sales-targets', async (req, res) => {
  const where = req.query.period ? { period: String(req.query.period) } : {};
  const data = await prisma.salesTarget.findMany({ where, orderBy: [{ period: 'desc' }, { scopeType: 'asc' }] });
  return res.json({ success: true, data });
});

router.post('/sales-targets', requireRole('ADMIN'), async (req, res) => {
  const period = text(req.body.period, 7);
  if (!/^\d{4}-\d{2}$/.test(period) || !text(req.body.scopeLabel)) return res.status(400).json({ success: false, message: 'دوره و عنوان هدف معتبر نیست' });
  const data = await prisma.salesTarget.create({ data: {
    period, scopeType: text(req.body.scopeType, 24) || 'COMPANY', scopeId: req.body.scopeId ? text(req.body.scopeId, 64) : null, scopeLabel: text(req.body.scopeLabel),
    targetAmount: bigint(req.body.targetAmount), targetCashShare: Number(req.body.targetCashShare) || 0, targetNewLeads: Number(req.body.targetNewLeads) || 0, targetProjects: Number(req.body.targetProjects) || 0,
  } });
  return res.status(201).json({ success: true, message: 'هدف فروش ثبت شد', data });
});

router.get('/contractors', async (req, res) => {
  const where = { customerType: { in: ['CONTRACTOR', 'END_CUSTOMER'] } };
  if (req.query.search?.trim()) where.OR = [{ fullName: { contains: req.query.search.trim(), mode: 'insensitive' } }, { company: { contains: req.query.search.trim(), mode: 'insensitive' } }, { mobile: { contains: req.query.search.trim() } }];
  const data = await prisma.customer.findMany({ where, include: { tier: true, _count: { select: { invoices: true, networkRegistrations: true, purchaseRequests: true } } }, orderBy: { totalPurchase: 'desc' }, take: 250 });
  return res.json({ success: true, data });
});

router.get('/purchase-requests', async (req, res) => {
  const where = req.query.status ? { status: String(req.query.status) } : {};
  const data = await prisma.purchaseRequest.findMany({ where, include: { customer: { select: { id: true, fullName: true, mobile: true, company: true } }, product: true }, orderBy: { createdAt: 'desc' }, take: 250 });
  return res.json({ success: true, data });
});

router.patch('/purchase-requests/:id', async (req, res) => {
  const allowed = ['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'];
  const status = String(req.body.status || '').toUpperCase();
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'وضعیت درخواست معتبر نیست' });
  const data = await prisma.purchaseRequest.update({ where: { id: req.params.id }, data: { status, assignedToId: req.body.assignedToId || req.user.id, ...(status === 'CONTACTED' && { contactedAt: new Date() }), ...(['CONVERTED', 'CLOSED'].includes(status) && { closedAt: new Date() }) } });
  return res.json({ success: true, message: 'وضعیت درخواست به‌روزرسانی شد', data });
});

router.get('/shipments', async (_req, res) => {
  const data = await prisma.shipment.findMany({ include: { customer: { select: { id: true, fullName: true, company: true, tier: true } } }, orderBy: { createdAt: 'desc' }, take: 250 });
  return res.json({ success: true, data });
});

router.post('/shipments', requireRole('ADMIN', 'LOYALTY_MANAGER'), async (req, res, next) => {
  try {
    if (!text(req.body.trackingCode, 48) || !text(req.body.destination)) return res.status(400).json({ success: false, message: 'کد رهگیری و مقصد الزامی است' });
    const cost = bigint(req.body.transportCost);
    const customer = req.body.customerId ? await prisma.customer.findUnique({ where: { id: req.body.customerId }, select: { totalPurchase: true, totalPoints: true, tier: { select: { code: true } } } }) : null;
    if (req.body.customerId && !customer) return res.status(404).json({ success: false, message: 'مشتری انتخاب‌شده یافت نشد' });
    const shippingBenefit = calculateShippingBenefit({
      transportCost: cost,
      purchaseAmount: req.body.purchaseAmount ?? customer?.totalPurchase,
      tierCode: customer?.tier?.code,
      pointsRequested: req.body.pointsUsed,
      availablePoints: customer?.totalPoints,
      requestedBenefitAmount: req.body.benefitAmount,
      benefitType: req.body.benefitType,
    });
    const data = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({ data: {
        trackingCode: text(req.body.trackingCode, 48), customerId: req.body.customerId || null, invoiceNumber: req.body.invoiceNumber ? text(req.body.invoiceNumber, 48) : null,
        origin: text(req.body.origin, 80) || 'سیرجان', destination: text(req.body.destination, 120), province: req.body.province ? text(req.body.province, 80) : null,
        transportCost: cost, benefitType: shippingBenefit.benefitType, benefitAmount: shippingBenefit.benefitAmount, pointsUsed: shippingBenefit.pointsUsed,
        requiresApproval: shippingBenefit.requiresApproval, status: text(req.body.status, 24) || 'PLANNED',
      } });
      if (shippingBenefit.pointsUsed > 0 && req.body.customerId) {
        const changed = await tx.customer.updateMany({ where: { id: req.body.customerId, totalPoints: { gte: shippingBenefit.pointsUsed } }, data: { totalPoints: { decrement: shippingBenefit.pointsUsed } } });
        if (changed.count !== 1) { const error = new Error('موجودی امتیاز برای مزیت حمل کافی نیست'); error.code = 'INSUFFICIENT_POINTS'; throw error; }
        const updated = await tx.customer.findUnique({ where: { id: req.body.customerId }, select: { totalPoints: true } });
        await tx.pointTransaction.create({ data: { customerId: req.body.customerId, type: 'REDEEM', sourceType: 'SHIPMENT', sourceId: created.id, points: -shippingBenefit.pointsUsed, balanceAfter: updated.totalPoints, description: `مصرف امتیاز برای حمل ${created.trackingCode}` } });
      }
      return created;
    });
    return res.status(201).json({ success: true, message: data.requiresApproval ? 'ارسال ثبت شد و به تأیید مدیر نیاز دارد' : 'ارسال ثبت شد', data });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_POINTS') return res.status(409).json({ success: false, message: error.message });
    return next(error);
  }
});

router.get('/data-quality/duplicates', async (_req, res) => {
  const customers = await prisma.customer.findMany({ select: { id: true, fullName: true, mobile: true, company: true, nationalId: true, totalPurchase: true, updatedAt: true } });
  const groups = new Map();
  const normalized = value => String(value || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  for (const customer of customers) {
    const keys = [customer.nationalId && `nid:${normalized(customer.nationalId)}`, customer.company && `company:${normalized(customer.company)}`, `name:${normalized(customer.fullName)}`].filter(Boolean);
    for (const key of keys) {
      const list = groups.get(key) || []; list.push(customer); groups.set(key, list);
    }
  }
  const seen = new Set(); const candidates = [];
  for (const [matchKey, list] of groups) {
    if (list.length < 2) continue;
    const ids = list.map(item => item.id).sort().join(':'); if (seen.has(ids)) continue; seen.add(ids);
    candidates.push({ matchKey, confidence: matchKey.startsWith('nid:') ? 100 : matchKey.startsWith('company:') ? 85 : 65, customers: list });
  }
  const pending = await prisma.customerMergeRequest.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  return res.json({ success: true, data: { candidates, pending } });
});

router.post('/data-quality/merge-requests', requireRole('ADMIN', 'LOYALTY_MANAGER'), async (req, res) => {
  if (!req.body.sourceCustomerId || !req.body.targetCustomerId || req.body.sourceCustomerId === req.body.targetCustomerId) return res.status(400).json({ success: false, message: 'دو رکورد متفاوت برای بررسی ادغام انتخاب کنید' });
  const data = await prisma.customerMergeRequest.create({ data: { sourceCustomerId: req.body.sourceCustomerId, targetCustomerId: req.body.targetCustomerId, reason: text(req.body.reason, 500) || 'رکورد مشابه شناسایی شد', evidence: req.body.evidence || null, requestedById: req.user.id } });
  return res.status(201).json({ success: true, message: 'درخواست ادغام در صف بررسی ایمن ثبت شد', data });
});

module.exports = router;
