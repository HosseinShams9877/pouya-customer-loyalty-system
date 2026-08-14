const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const loyaltyService = require('../services/loyaltyService');

const router = express.Router();
router.use(requireAuth);

const managerOnly = requireRole('ADMIN', 'LOYALTY_MANAGER');

router.post('/maintenance/expire-points', managerOnly, async (_req, res) => {
  const data = await loyaltyService.expireDuePoints();
  return res.json({ success: true, message: 'پردازش انقضای امتیازها انجام شد', data });
});

function cleanText(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function segmentWhere(criteria = {}) {
  const where = {};
  if (criteria.status) where.status = criteria.status;
  if (criteria.memberStatus) where.memberStatus = criteria.memberStatus;
  if (criteria.minLifetimePoints != null) where.lifetimePoints = { ...(where.lifetimePoints || {}), gte: Number(criteria.minLifetimePoints) };
  if (criteria.maxLifetimePoints != null) where.lifetimePoints = { ...(where.lifetimePoints || {}), lte: Number(criteria.maxLifetimePoints) };
  if (criteria.minTotalPurchase != null) where.totalPurchase = { ...(where.totalPurchase || {}), gte: BigInt(criteria.minTotalPurchase) };
  if (criteria.maxDaysSinceLast != null) where.daysSinceLast = { ...(where.daysSinceLast || {}), lte: Number(criteria.maxDaysSinceLast) };
  if (criteria.minDaysSinceLast != null) where.daysSinceLast = { ...(where.daysSinceLast || {}), gte: Number(criteria.minDaysSinceLast) };
  if (criteria.maxInvoicesCount != null) where.invoicesCount = { ...(where.invoicesCount || {}), lte: Number(criteria.maxInvoicesCount) };
  if (criteria.minInvoicesCount != null) where.invoicesCount = { ...(where.invoicesCount || {}), gte: Number(criteria.minInvoicesCount) };
  return where;
}

router.get('/dashboard', async (_req, res) => {
  try {
    const [
      memberCount,
      activeMembers,
      memberAggregates,
      redemptionCount,
      fulfilledCount,
      tierRows,
      tiers,
      recentRedemptions,
      transactionCount,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { memberStatus: 'ACTIVE', status: { not: 'CHURNED' } } }),
      prisma.customer.aggregate({ _sum: { totalPoints: true, lifetimePoints: true, walletBalance: true, totalPurchase: true } }),
      prisma.rewardRedemption.count(),
      prisma.rewardRedemption.count({ where: { status: 'FULFILLED' } }),
      prisma.customer.groupBy({ by: ['tierId'], _count: true }),
      prisma.loyaltyTier.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.rewardRedemption.findMany({ include: { customer: true, reward: true }, orderBy: { requestedAt: 'desc' }, take: 6 }),
      prisma.pointTransaction.count(),
    ]);
    const tierDistribution = tiers.map((tier) => ({
      ...tier,
      members: tierRows.find((row) => row.tierId === tier.id)?._count || 0,
    }));
    return res.json({
      success: true,
      data: {
        kpis: {
          memberCount,
          activeMembers,
          activeRate: memberCount ? Math.round((activeMembers / memberCount) * 100) : 0,
          spendablePoints: memberAggregates._sum.totalPoints || 0,
          lifetimePoints: memberAggregates._sum.lifetimePoints || 0,
          walletLiability: memberAggregates._sum.walletBalance || 0n,
          totalPurchase: memberAggregates._sum.totalPurchase || 0n,
          redemptionCount,
          redemptionFulfillmentRate: redemptionCount ? Math.round((fulfilledCount / redemptionCount) * 100) : 0,
          transactionCount,
        },
        tierDistribution,
        recentRedemptions,
      },
    });
  } catch (error) {
    console.error('[loyalty/dashboard]', error.message);
    return res.status(500).json({ success: false, message: 'خطا در دریافت داشبورد باشگاه' });
  }
});

router.get('/tiers', async (_req, res) => {
  const data = await prisma.loyaltyTier.findMany({ include: { _count: { select: { customers: true } } }, orderBy: { sortOrder: 'asc' } });
  return res.json({ success: true, data });
});

router.post('/tiers', managerOnly, async (req, res) => {
  const { code, title, description, color, minPoints, multiplier, benefits, sortOrder, audienceType = 'CONTRACTOR' } = req.body;
  if (!cleanText(code, 32) || !cleanText(title, 80)) return res.status(400).json({ success: false, message: 'کد و عنوان سطح الزامی است' });
  const data = await prisma.loyaltyTier.create({
    data: {
      code: cleanText(code, 32).toUpperCase(), title: cleanText(title, 80), description: cleanText(description, 500) || null,
      audienceType: ['CONTRACTOR', 'REPRESENTATIVE', 'ALL'].includes(audienceType) ? audienceType : 'CONTRACTOR',
      color: cleanText(color, 16) || '#64748B', minPoints: Math.max(0, Number(minPoints) || 0),
      multiplier: Math.max(1, Number(multiplier) || 1), benefits: Array.isArray(benefits) ? benefits : [], sortOrder: Number(sortOrder) || 0,
    },
  });
  return res.status(201).json({ success: true, data });
});

router.patch('/tiers/:id', managerOnly, async (req, res) => {
  const allowed = ['title', 'description', 'color', 'minPoints', 'multiplier', 'benefits', 'sortOrder', 'isActive', 'audienceType'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const result = await prisma.loyaltyTier.update({ where: { id: req.params.id }, data });
  return res.json({ success: true, data: result });
});

router.get('/rules', async (_req, res) => {
  const data = await prisma.loyaltyRule.findMany({ orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] });
  return res.json({ success: true, data });
});

router.post('/rules', managerOnly, async (req, res) => {
  const { code, title, description, eventType, conditions = {}, action = {}, priority = 100, stackable = true, startsAt, endsAt } = req.body;
  if (!code || !title || !eventType || !action.type) return res.status(400).json({ success: false, message: 'اطلاعات قانون کامل نیست' });
  const data = await prisma.loyaltyRule.create({
    data: {
      code: cleanText(code, 48).toUpperCase(), title: cleanText(title, 120), description: cleanText(description, 500) || null,
      eventType: cleanText(eventType, 48), conditions, action, priority: Number(priority) || 100, stackable: Boolean(stackable),
      startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  return res.status(201).json({ success: true, data });
});

router.patch('/rules/:id', managerOnly, async (req, res) => {
  const allowed = ['title', 'description', 'eventType', 'conditions', 'action', 'priority', 'stackable', 'isActive', 'startsAt', 'endsAt'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const result = await prisma.loyaltyRule.update({ where: { id: req.params.id }, data });
  return res.json({ success: true, data: result });
});

router.get('/rewards', async (req, res) => {
  const where = req.query.active === 'true' ? { isActive: true } : {};
  const data = await prisma.reward.findMany({ where, include: { eligibleTier: true, _count: { select: { redemptions: true } } }, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] });
  return res.json({ success: true, data });
});

router.post('/rewards', managerOnly, async (req, res) => {
  const { code, title, description, type, costPoints, cashValue, stock, imageIcon, eligibleTierId, validityDays, fulfillmentMode, isFeatured } = req.body;
  if (!code || !title || !type || Number(costPoints) < 0) return res.status(400).json({ success: false, message: 'اطلاعات پاداش کامل نیست' });
  const data = await prisma.reward.create({
    data: {
      code: cleanText(code, 48).toUpperCase(), title: cleanText(title, 120), description: cleanText(description, 700) || null,
      type: cleanText(type, 32), costPoints: Number(costPoints), cashValue: cashValue == null ? null : BigInt(cashValue),
      stock: stock == null || stock === '' ? null : Number(stock), imageIcon: cleanText(imageIcon, 32) || 'gift',
      eligibleTierId: eligibleTierId || null, validityDays: Math.max(1, Number(validityDays) || 30),
      fulfillmentMode: cleanText(fulfillmentMode, 24) || 'MANUAL', isFeatured: Boolean(isFeatured),
    },
  });
  return res.status(201).json({ success: true, data });
});

router.patch('/rewards/:id', managerOnly, async (req, res) => {
  const allowed = ['title', 'description', 'type', 'costPoints', 'cashValue', 'stock', 'imageIcon', 'eligibleTierId', 'validityDays', 'fulfillmentMode', 'isFeatured', 'isActive', 'startsAt', 'endsAt'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (data.cashValue != null) data.cashValue = BigInt(data.cashValue);
  const result = await prisma.reward.update({ where: { id: req.params.id }, data });
  return res.json({ success: true, data: result });
});

router.get('/redemptions', async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const data = await prisma.rewardRedemption.findMany({
    where, include: { customer: { include: { tier: true } }, reward: true }, orderBy: { requestedAt: 'desc' }, take: 200,
  });
  return res.json({ success: true, data });
});

router.patch('/redemptions/:id/status', managerOnly, async (req, res) => {
  const nextStatus = req.body.status;
  const allowed = ['APPROVED', 'FULFILLED', 'CANCELLED'];
  if (!allowed.includes(nextStatus)) return res.status(400).json({ success: false, message: 'وضعیت نامعتبر است' });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.rewardRedemption.findUnique({ where: { id: req.params.id }, include: { customer: true, reward: true } });
      if (!item) throw new Error('درخواست یافت نشد');
      const transitions = { REQUESTED: ['APPROVED', 'CANCELLED'], APPROVED: ['FULFILLED', 'CANCELLED'], FULFILLED: [], CANCELLED: [] };
      if (!transitions[item.status]?.includes(nextStatus)) throw new Error('تغییر وضعیت مجاز نیست');
      const now = new Date();
      if (nextStatus === 'CANCELLED') {
        const balanceAfter = item.customer.totalPoints + item.pointsCost;
        await tx.customer.update({ where: { id: item.customerId }, data: { totalPoints: balanceAfter, redeemedPoints: { decrement: item.pointsCost } } });
        await tx.pointTransaction.create({
          data: { customerId: item.customerId, type: 'REFUND', sourceType: 'REWARD', sourceId: item.id, points: item.pointsCost, remainingPoints: item.pointsCost, balanceAfter, description: `برگشت امتیاز پاداش «${item.reward.title}»` },
        });
        await tx.reward.update({ where: { id: item.rewardId }, data: { redeemedCount: { decrement: 1 }, ...(item.reward.stock != null && { stock: { increment: 1 } }) } });
      }
      if (nextStatus === 'FULFILLED' && item.reward.fulfillmentMode === 'WALLET' && item.cashValue && item.cashValue > 0n) {
        const walletAfter = item.customer.walletBalance + item.cashValue;
        await tx.customer.update({ where: { id: item.customerId }, data: { walletBalance: walletAfter } });
        await tx.walletTransaction.create({
          data: { customerId: item.customerId, type: 'CREDIT', sourceType: 'REWARD', sourceId: item.id, amount: item.cashValue, balanceAfter: walletAfter, description: `اعتبار پاداش «${item.reward.title}»` },
        });
      }
      return tx.rewardRedemption.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          fulfillmentNote: cleanText(req.body.note, 500) || item.fulfillmentNote,
          ...(nextStatus === 'APPROVED' && { approvedAt: now }),
          ...(nextStatus === 'FULFILLED' && { fulfilledAt: now }),
          ...(nextStatus === 'CANCELLED' && { cancelledAt: now }),
        },
        include: { customer: true, reward: true },
      });
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/missions', async (_req, res) => {
  const data = await prisma.mission.findMany({ include: { _count: { select: { participants: true } } }, orderBy: { createdAt: 'desc' } });
  return res.json({ success: true, data });
});

router.post('/missions', managerOnly, async (req, res) => {
  const { code, title, description, actionType, targetValue, rewardPoints, badge, startsAt, endsAt } = req.body;
  if (!code || !title || !description || !actionType || Number(targetValue) < 1) return res.status(400).json({ success: false, message: 'اطلاعات مأموریت کامل نیست' });
  const data = await prisma.mission.create({ data: { code: cleanText(code, 48).toUpperCase(), title: cleanText(title, 120), description: cleanText(description, 700), actionType, targetValue: Number(targetValue), rewardPoints: Math.max(0, Number(rewardPoints) || 0), badge: cleanText(badge, 32) || null, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null } });
  return res.status(201).json({ success: true, data });
});

router.patch('/missions/:id', managerOnly, async (req, res) => {
  const allowed = ['title', 'description', 'actionType', 'targetValue', 'rewardPoints', 'badge', 'isActive', 'startsAt', 'endsAt'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const result = await prisma.mission.update({ where: { id: req.params.id }, data });
  return res.json({ success: true, data: result });
});

router.get('/segments', async (_req, res) => {
  const segments = await prisma.loyaltySegment.findMany({ orderBy: { createdAt: 'asc' } });
  const data = await Promise.all(segments.map(async (segment) => ({ ...segment, memberCount: await prisma.customer.count({ where: segmentWhere(segment.criteria) }) })));
  return res.json({ success: true, data });
});

router.post('/segments', managerOnly, async (req, res) => {
  const { code, title, description, color, criteria = {}, isDynamic = true } = req.body;
  if (!code || !title) return res.status(400).json({ success: false, message: 'کد و عنوان بخش الزامی است' });
  const data = await prisma.loyaltySegment.create({ data: { code: cleanText(code, 48).toUpperCase(), title: cleanText(title, 120), description: cleanText(description, 500) || null, color: cleanText(color, 16) || '#0EA5E9', criteria, isDynamic: Boolean(isDynamic) } });
  return res.status(201).json({ success: true, data });
});

router.get('/transactions', async (req, res) => {
  const where = req.query.customerId ? { customerId: req.query.customerId } : {};
  const data = await prisma.pointTransaction.findMany({ where, include: { customer: { select: { id: true, fullName: true, mobile: true } } }, orderBy: { createdAt: 'desc' }, take: 300 });
  return res.json({ success: true, data });
});

router.get('/offers', async (_req, res) => {
  const data = await prisma.loyaltyOffer.findMany({ include: { segment: true, _count: { select: { coupons: true } } }, orderBy: { createdAt: 'desc' } });
  return res.json({ success: true, data });
});

module.exports = router;
