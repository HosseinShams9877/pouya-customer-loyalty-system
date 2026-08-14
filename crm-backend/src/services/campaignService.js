/**
 * Campaign Service — ماژول کمپین و آفرهای بازاریابی
 * 
 * مخاطبان بر اساس وضعیت مشتری:
 *   - ALL_ACTIVE: همه مشتریان فعال
 *   - GOLD: مشتریان طلایی (امتیاز بالا)
 *   - AT_RISK: مشتریان در معرض ریزش
 */

const { PrismaClient } = require('@prisma/client');
const smsService = require('./smsService');

const prisma = new PrismaClient();

// آستانه مشتری طلایی
const GOLD_MIN_POINTS = parseInt(process.env.GOLD_MIN_POINTS, 10) || 2000;

// ──────────────────────────────────────────────
// انواع مخاطب
// ──────────────────────────────────────────────
const AUDIENCE_TYPES = {
  ALL_ACTIVE: 'ALL_ACTIVE',
  GOLD: 'GOLD',
  AT_RISK: 'AT_RISK',
};

const AUDIENCE_LABELS = {
  [AUDIENCE_TYPES.ALL_ACTIVE]: 'همه مشتریان فعال',
  [AUDIENCE_TYPES.GOLD]: 'مشتریان سطح طلایی',
  [AUDIENCE_TYPES.AT_RISK]: 'مشتریان در معرض ریزش',
};

// ──────────────────────────────────────────────
// ایجاد کمپین
// ──────────────────────────────────────────────

/**
 * ایجاد و ارسال کمپین پیامکی
 * 
 * @param {object} params
 * @param {string} params.title       — عنوان کمپین
 * @param {string} params.message     — متن پیامک
 * @param {string} params.audienceType — نوع مخاطب
 * @param {string} params.createdBy   — شناسه ایجادکننده
 * @returns {Promise<object>}
 */
async function createCampaign({ title, message, audienceType, createdBy }) {
  if (!AUDIENCE_TYPES[audienceType]) {
    throw new Error(`نوع مخاطب نامعتبر: ${audienceType}`);
  }

  // ۱. پیدا کردن مخاطبان
  const where = {};
  switch (audienceType) {
    case AUDIENCE_TYPES.ALL_ACTIVE:
      where.status = 'ACTIVE';
      where.mobile = { not: null };
      break;
    case AUDIENCE_TYPES.GOLD:
      where.status = 'ACTIVE';
      where.totalPoints = { gte: GOLD_MIN_POINTS };
      where.mobile = { not: null };
      break;
    case AUDIENCE_TYPES.AT_RISK:
      where.status = 'IN_RISK';
      where.mobile = { not: null };
      break;
  }

  const customers = await prisma.customer.findMany({
    where,
    select: { id: true, fullName: true, mobile: true },
  });

  if (customers.length === 0) {
    throw new Error('هیچ مخاطبی یافت نشد');
  }

  // ۲. ایجاد رکورد کمپین
  const campaign = await prisma.campaign.create({
    data: {
      title,
      message,
      audienceType,
      status: 'SENDING',
      totalRecipients: customers.length,
      sentCount: 0,
      failedCount: 0,
      createdBy,
    },
  });

  // ۳. ارسال پیامک (بچ)
  const phoneNumbers = customers.map((c) => c.mobile);
  const smsResult = await smsService.sendBulkSMS(phoneNumbers, message);

  // ۴. بروزرسانی رکورد کمپین
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'COMPLETED',
      sentCount: smsResult.sent,
      failedCount: smsResult.failed,
      completedAt: new Date(),
    },
  });

  console.log(`[campaignService] کمپین «${title}»: ${smsResult.sent}/${smsResult.total} ارسال شد`);

  return {
    id: campaign.id,
    title,
    audienceType,
    audienceLabel: AUDIENCE_LABELS[audienceType],
    totalRecipients: customers.length,
    sentCount: smsResult.sent,
    failedCount: smsResult.failed,
    status: 'COMPLETED',
  };
}

/**
 * لیست کمپین‌ها با صفحه‌بندی
 */
async function listCampaigns({ page = 1, limit = 20 } = {}) {
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.campaign.count(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  createCampaign,
  listCampaigns,
  AUDIENCE_TYPES,
  AUDIENCE_LABELS,
};
