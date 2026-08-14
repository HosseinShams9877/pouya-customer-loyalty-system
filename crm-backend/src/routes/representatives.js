const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireMember } = require('../middleware/memberAuth');
const smsService = require('../services/smsService');
const settingsService = require('../services/settingsService');
const loyaltyService = require('../services/loyaltyService');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const where = req.query.status ? { status: req.query.status } : {};
  const items = await prisma.representativeAccount.findMany({
    where,
    include: { customer: { include: { tier: true } }, _count: { select: { registrations: true } } },
    orderBy: [{ grade: 'desc' }, { updatedAt: 'desc' }],
  });
  return res.json({ success: true, data: items });
});

router.get('/registrations', requireAuth, async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const items = await prisma.representativeRegistration.findMany({
    where,
    include: { representative: { include: { customer: true } }, project: true, endCustomer: true },
    orderBy: { createdAt: 'desc' },
    take: 250,
  });
  return res.json({ success: true, data: items });
});

router.patch('/registrations/:id/review', requireAuth, requireRole('ADMIN', 'LOYALTY_MANAGER'), async (req, res) => {
  const status = String(req.body.status || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'وضعیت بررسی نامعتبر است' });
  const registration = await prisma.representativeRegistration.findUnique({
    where: { id: req.params.id }, include: { representative: { include: { customer: true } } },
  });
  if (!registration) return res.status(404).json({ success: false, message: 'ثبت پروژه یافت نشد' });
  if (registration.status !== 'PENDING') return res.status(409).json({ success: false, message: 'این درخواست قبلاً بررسی شده است' });

  const data = await prisma.$transaction(async (tx) => {
    let pointsAwarded = 0;
    if (status === 'APPROVED') {
      pointsAwarded = Math.max(0, Number(await settingsService.get('projectReferralPoints', tx)) || 300);
      const customer = registration.representative.customer;
      const balanceAfter = customer.totalPoints + pointsAwarded;
      await tx.customer.update({ where: { id: customer.id }, data: { totalPoints: balanceAfter, lifetimePoints: { increment: pointsAwarded }, lastActivityAt: new Date() } });
      await tx.pointTransaction.create({
        data: { customerId: customer.id, type: 'EARN', sourceType: 'PROJECT_REFERRAL', sourceId: registration.id, points: pointsAwarded, remainingPoints: pointsAwarded, balanceAfter, description: `پاداش ثبت پروژه ${registration.contractorName}` },
      });
      await loyaltyService.evaluateTier(tx, customer.id, customer.lifetimePoints + pointsAwarded);
    }
    return tx.representativeRegistration.update({
      where: { id: registration.id },
      data: { status, reviewNote: req.body.reviewNote || null, discountPercent: status === 'APPROVED' ? Math.max(0, Number(req.body.discountPercent) || registration.representative.discountRate) : 0, pointsAwarded, approvedAt: status === 'APPROVED' ? new Date() : null, approvedById: req.user.id },
      include: { representative: { include: { customer: true } }, project: true, endCustomer: true },
    });
  });
  return res.json({ success: true, message: status === 'APPROVED' ? 'پروژه تأیید و پاداش معرفی ثبت شد' : 'درخواست رد شد', data });
});

router.get('/portal/me', requireMember, async (req, res) => {
  const data = await prisma.representativeAccount.findUnique({
    where: { customerId: req.member.id },
    include: { customer: { include: { tier: true } }, registrations: { include: { project: true, endCustomer: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!data) return res.status(403).json({ success: false, message: 'حساب نمایندگی برای این عضو فعال نیست' });
  return res.json({ success: true, data });
});

router.post('/portal/registrations', requireMember, async (req, res) => {
  const representative = await prisma.representativeAccount.findUnique({ where: { customerId: req.member.id } });
  if (!representative || representative.status !== 'ACTIVE') return res.status(403).json({ success: false, message: 'نمایندگی فعال یافت نشد' });
  const contractorMobile = smsService.normalizePhone(req.body.contractorMobile);
  if (!req.body.contractorName?.trim() || !contractorMobile || !req.body.projectTitle?.trim()) {
    return res.status(400).json({ success: false, message: 'نام و موبایل پیمانکار و نام پروژه الزامی است' });
  }
  const data = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { title: String(req.body.projectTitle).trim(), city: req.body.city?.trim() || null, executor: String(req.body.contractorName).trim(), status: req.body.projectStatus || 'PLANNING' },
    });
    let endCustomer = await tx.customer.findUnique({ where: { mobile: contractorMobile } });
    if (!endCustomer) {
      const baseTier = await tx.loyaltyTier.findFirst({ where: { isActive: true, audienceType: { in: ['CONTRACTOR', 'ALL'] } }, orderBy: { minPoints: 'asc' } });
      endCustomer = await tx.customer.create({
        data: { fullName: String(req.body.contractorName).trim(), mobile: contractorMobile, company: req.body.contractorCompany?.trim() || null, city: req.body.city?.trim() || null, customerType: 'END_CUSTOMER', tierId: baseTier?.id || null, status: 'NEW' },
      });
    }
    return tx.representativeRegistration.create({
      data: { representativeId: representative.id, endCustomerId: endCustomer.id, projectId: project.id, contractorName: String(req.body.contractorName).trim(), contractorMobile, contractorCompany: req.body.contractorCompany?.trim() || null, city: req.body.city?.trim() || null, estimatedVolume: BigInt(req.body.estimatedVolume || 0) },
      include: { project: true, endCustomer: true },
    });
  });
  return res.status(201).json({ success: true, message: 'پیمانکار و پروژه برای بررسی تخفیف نمایندگی ثبت شد', data });
});

module.exports = router;
