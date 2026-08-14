/**
 * CSAT Service — سیستم سنجش رضایت مشتری
 * 
 * جریان:
 *   ثبت تعامل CALL → ایجاد CsatToken → ارسال پیامک → مشتری امتیاز می‌دهد
 *   اگر امتیاز ۱ یا ۲ → اعلان به مدیر فروش
 */

const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const communicationService = require('./communicationService');
const notificationService = require('./notificationService');

// لینک صفحه CSAT (در env قابل تنظیم)
const CSAT_BASE_URL = process.env.CSAT_BASE_URL || 'https://app.domain.com/csat';

// عمر توکن: ۷ روز (میلی‌ثانیه)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ──────────────────────────────────────────────
// ایجاد CSAT پس از ثبت تعامل
// ──────────────────────────────────────────────

/**
 * ایجاد توکن CSAT و ارسال پیامک
 * این تابع بعد از ثبت تعامل CALL فراخوانی می‌شود
 * 
 * @param {object} params
 * @param {string} params.interactionId — شناسه تعامل
 * @param {string} params.customerId   — شناسه مشتری (از Lead)
 * @param {string} params.customerName — نام مشتری
 * @param {string} params.customerMobile — شماره موبایل مشتری
 * @param {string} params.leadId       — شناسه سرنخ
 * @param {string} [params.assignedToId] — شناسه کارشناس
 * @returns {Promise<object>}
 */
async function createCsatToken({
  interactionId,
  customerId,
  customerName,
  customerMobile,
  leadId,
  assignedToId,
}) {
  // فقط برای تعاملات CALL
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // ۱. ثبت در دیتابیس
  const csat = await prisma.csatToken.create({
    data: {
      customerId,
      interactionId,
      leadId,
      assignedToId,
      token,
      status: 'PENDING',
      expiresAt,
    },
  });

  // ۲. ارسال پیامک
  let smsResult = null;
  if (customerMobile) {
    const link = `${CSAT_BASE_URL}/${token}`;
    const message = `مشتری گرامی، کارشناس ما با شما تماس گرفت. لطفاً رضایت خود را از ۱ تا ۵ به این لینک امتیاز دهید: ${link}`;

    try {
      smsResult = await communicationService.sendTrackedSms({ customerId, mobile: customerMobile, body: message, messageType: 'CSAT' });
      console.log(`[csatService] پیامک CSAT ارسال شد → ${customerMobile}`);
    } catch (error) {
      console.error(`[csatService] خطا در ارسال پیامک CSAT:`, error.message);
    }
  }

  return {
    csatId: csat.id,
    token,
    expiresAt: csat.expiresAt,
    smsResult,
  };
}

// ──────────────────────────────────────────────
// دریافت اطلاعات توکن (GET /api/v1/csat/:token)
// عمومی — بدون احراز هویت
// ──────────────────────────────────────────────

async function getTokenInfo(token) {
  const csat = await prisma.csatToken.findUnique({
    where: { token },
    include: {
      interaction: {
        select: { type: true, createdAt: true, description: true },
      },
      lead: {
        select: { fullName: true, company: true },
      },
    },
  });

  if (!csat) {
    return { valid: false, reason: 'TOKEN_NOT_FOUND' };
  }

  // بررسی انقضا
  if (csat.expiresAt < new Date()) {
    return { valid: false, reason: 'TOKEN_EXPIRED' };
  }

  // بررسی وضعیت
  if (csat.status === 'SUBMITTED') {
    return { valid: false, reason: 'ALREADY_SUBMITTED' };
  }

  return {
    valid: true,
    data: {
      token: csat.token,
      status: csat.status,
      leadName: csat.lead?.fullName,
      company: csat.lead?.company,
      interactionDate: csat.interaction?.createdAt,
      expiresAt: csat.expiresAt,
    },
  };
}

// ──────────────────────────────────────────────
// ثبت امتیاز (POST /api/v1/csat/:token)
// عمومی — بدون احراز هویت
// ──────────────────────────────────────────────

/**
 * ثبت امتیاز مشتری
 * @param {string} token
 * @param {number} score  — ۱ تا ۵
 * @returns {Promise<object>}
 */
async function submitScore(token, score) {
  // اعتبارسنجی امتیاز
  const numScore = parseInt(score, 10);
  if (isNaN(numScore) || numScore < 1 || numScore > 5) {
    return { success: false, error: 'امتیاز باید بین ۱ تا ۵ باشد' };
  }

  // دریافت رکورد CSAT
  const csat = await prisma.csatToken.findUnique({
    where: { token },
    include: {
      lead: { select: { fullName: true } },
      interaction: { select: { description: true, createdAt: true } },
    },
  });

  if (!csat) {
    return { success: false, error: 'توکن نامعتبر' };
  }

  if (csat.expiresAt < new Date()) {
    return { success: false, error: 'توکن منقضی شده' };
  }

  if (csat.status === 'SUBMITTED') {
    return { success: false, error: 'امتیاز قبلاً ثبت شده' };
  }

  // ثبت امتیاز
  await prisma.$transaction(async (tx) => {
    await tx.csatToken.update({ where: { token }, data: { score: numScore, status: 'SUBMITTED' } });
    const stats = await tx.csatToken.aggregate({ where: { customerId: csat.customerId, status: 'SUBMITTED', score: { not: null } }, _avg: { score: true }, _count: { score: true } });
    await tx.customer.update({ where: { id: csat.customerId }, data: { csatAverage: stats._avg.score || numScore, csatResponses: stats._count.score } });
  });

  console.log(`[csatService] امتیاز ${numScore} ثبت شد → token: ${token}`);

  // ─── اگر امتیاز پایین (۱ یا ۲) → اعلان به مدیران ───
  if (numScore <= 2) {
    try {
      // پیدا کردن تمام ادمین‌ها
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        select: { id: true },
      });

      if (admins.length > 0) {
        const adminIds = admins.map((a) => a.id);
        await notificationService.notifyMultiple({
          type: notificationService.NOTIFICATION_TYPES.SYSTEM,
          title: 'رضایت مشتری پایین',
          message: `مشتری «${csat.lead?.fullName || 'نامشخص'}» به تماس اخیر امتیاز ${numScore}/۵ داده. لطفاً بررسی کنید.`,
          link: `/leads/${csat.leadId}`,
          data: {
            csatToken: token,
            score: numScore,
            customerId: csat.customerId,
            interactionId: csat.interactionId,
          },
          sendPush: true,
          sendSMS: false,
          urgency: 'high',
        }, adminIds);

        console.log(`[csatService] اعلان رضایت پایین ارسال شد به ${admins.length} مدیر`);
      }
    } catch (notifError) {
      console.error('[csatService] خطا در ارسال اعلان رضایت پایین:', notifError.message);
    }
  }

  return {
    success: true,
    score: numScore,
    message: numScore >= 4 ? 'تشکر از نظر مثبت شما!' : 'از بازخورد شما سپاسگزاریم. مشکل بررسی خواهد شد.',
  };
}

// ──────────────────────────────────────────────
// آمار CSAT (برای داشبورد مدیریتی)
// ──────────────────────────────────────────────

async function getStats() {
  const [total, submitted, avgScore] = await Promise.all([
    prisma.csatToken.count(),
    prisma.csatToken.count({ where: { status: 'SUBMITTED' } }),
    prisma.csatToken.aggregate({
      where: { status: 'SUBMITTED', score: { not: null } },
      _avg: { score: true },
    }),
  ]);

  // توزیع امتیاز
  const distribution = await prisma.csatToken.groupBy({
    by: ['score'],
    where: { status: 'SUBMITTED', score: { not: null } },
    _count: { score: true },
    orderBy: { score: 'asc' },
  });

  return {
    total,
    submitted,
    pending: total - submitted,
    responseRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    averageScore: avgScore._avg.score ? Math.round(avgScore._avg.score * 10) / 10 : null,
    distribution: distribution.map((d) => ({ score: d.score, count: d._count.score })),
  };
}

module.exports = {
  createCsatToken,
  getTokenInfo,
  submitScore,
  getStats,
};
