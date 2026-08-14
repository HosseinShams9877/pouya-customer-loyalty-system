/**
 * Notification Service — دیسپچر مرکزی اعلان‌ها
 * 
 * وظایف:
 * ۱. ثبت اعلان در دیتابیس (Prisma)
 * ۲. ارسال Web Push به تمام subscription‌های کاربر
 * ۳. ارسال پیامک (در صورت نیاز)
 * 
 * جریان:
 *   notify() → ثبت DB → push → sms → نتیجه
 */

const { PrismaClient } = require('@prisma/client');
const smsService = require('./smsService');
const pushService = require('./pushService');

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// انواع اعلان
// ──────────────────────────────────────────────
const NOTIFICATION_TYPES = {
  // فروش
  INVOICE_CREATED:    'INVOICE_CREATED',
  INVOICE_OVERDUE:    'INVOICE_OVERDUE',
  PAYMENT_RECEIVED:   'PAYMENT_RECEIVED',

  // سرنخ
  NEW_LEAD:           'NEW_LEAD',
  LEAD_STAGE_CHANGE:  'LEAD_STAGE_CHANGE',
  LEAD_LOST:          'LEAD_LOST',

  // تعامل
  FOLLOWUP_DUE:       'FOLLOWUP_DUE',
  FOLLOWUP_OVERDUE:   'FOLLOWUP_OVERDUE',

  // ریزش
  CHURN_RISK:         'CHURN_RISK',
  CHURN_CONFIRMED:    'CHURN_CONFIRMED',

  // سیستم
  LOYALTY_EARNED:     'LOYALTY_EARNED',
  LOYALTY_REDEEMED:   'LOYALTY_REDEEMED',
  SYSTEM:             'SYSTEM',
};

// قالب‌های پیامک برای هر نوع
const SMS_TEMPLATES = {
  [NOTIFICATION_TYPES.INVOICE_CREATED]:    (data) => `فاکتور #${data.invoiceNumber} به مبلغ ${data.amount} ریال ثبت شد.`,
  [NOTIFICATION_TYPES.INVOICE_OVERDUE]:    (data) => `فاکتور #${data.invoiceNumber} ${data.daysOverdue} روز سررسید گذشته است.`,
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]:   (data) => `پرداخت ${data.amount} ریال برای فاکتور #${data.invoiceNumber} ثبت شد.`,
  [NOTIFICATION_TYPES.FOLLOWUP_DUE]:       (data) => `پیگیری «${data.leadName}» برای امروز برنامه‌ریزی شده است.`,
  [NOTIFICATION_TYPES.FOLLOWUP_OVERDUE]:   (data) => `پیگیری «${data.leadName}» ${data.daysOverdue} روز تاخیر دارد!`,
  [NOTIFICATION_TYPES.CHURN_RISK]:         (data) => `هشدار ریزش: مشتری «${data.customerName}» در معرض ریزش قرار دارد.`,
  [NOTIFICATION_TYPES.CHURN_CONFIRMED]:    (data) => `مشتری «${data.customerName}» از لیست فعال حذف شد.`,
  [NOTIFICATION_TYPES.NEW_LEAD]:           (data) => `سرنخ جدید: «${data.leadName}» از طریق ${data.source}.`,
  [NOTIFICATION_TYPES.LEAD_STAGE_CHANGE]:  (data) => `مرحله سرنخ «${data.leadName}» به «${data.newStage}» تغییر کرد.`,
  [NOTIFICATION_TYPES.LEAD_LOST]:          (data) => `سرنخ «${data.leadName}» با دلیل «${data.lostReason}» از دست رفت.`,
  [NOTIFICATION_TYPES.LOYALTY_EARNED]:     (data) => `${data.points} امتیاز به کیف پول شما اضافه شد.`,
  [NOTIFICATION_TYPES.LOYALTY_REDEEMED]:   (data) => `${data.points} امتیاز از کیف پول شما کسر شد.`,
  [NOTIFICATION_TYPES.SYSTEM]:             (data) => data.message || 'اعلان سیستم',
};

// ──────────────────────────────────────────────
// تابع اصلی
// ──────────────────────────────────────────────

/**
 * ارسال اعلان کامل (DB + Push + SMS)
 * 
 * @param {object} params
 * @param {string} params.type        — نوع اعلان (از NOTIFICATION_TYPES)
 * @param {string} params.title       — عنوان
 * @param {string} params.message     — متن کامل
 * @param {string} params.userId      — شناسه کاربر گیرنده
 * @param {string} [params.link]      — لینک مرتبط (مثلاً /leads/123)
 * @param {object} [params.data]      — داده اضافی (JSON)
 * @param {boolean} [params.sendSMS]  — آیا پیامک هم ارسال شود؟
 * @param {boolean} [params.sendPush] — آیا Push هم ارسال شود؟ (پیش‌فرض: true)
 * @param {string} [params.urgency]   — فوریت Push: normal | low | high
 * @returns {Promise<object>} نتیجه کامل
 */
async function notify({
  type,
  title,
  message,
  userId,
  link = null,
  data = {},
  sendSMS = false,
  sendPush = true,
  urgency = 'normal',
}) {
  const result = {
    dbSaved: false,
    notificationId: null,
    pushResults: null,
    smsResult: null,
  };

  try {
    // ─── مرحله ۱: ثبت در دیتابیس ───
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link,
        data: data, // PrismaJson
        userId,
        isRead: false,
      },
    });
    result.dbSaved = true;
    result.notificationId = notification.id;

    // ─── مرحله ۲: ارسال Web Push ───
    if (sendPush && pushService.isConfigured()) {
      try {
        // دریافت تمام subscription‌های فعال کاربر
        const subscriptions = await prisma.pushSubscription.findMany({
          where: { userId, active: true },
        });

        if (subscriptions.length > 0) {
          const pushPayload = {
            title,
            body: message,
            url: link || '/notifications',
            data: {
              notificationId: notification.id,
              type,
              ...data,
            },
          };

          const pushResult = await pushService.sendBulkPush(
            subscriptions.map((s) => ({
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dhKey, auth: s.authKey },
            })),
            pushPayload,
            { urgency }
          );
          result.pushResults = pushResult;

          // حذف subscription‌های منقضی از دیتابیس
          if (pushResult.expiredSubscriptions.length > 0) {
            await prisma.pushSubscription.updateMany({
              where: {
                endpoint: { in: pushResult.expiredSubscriptions },
              },
              data: { active: false },
            });
            console.log(
              `[notificationService] ${pushResult.expiredSubscriptions.length} subscription منقضی غیرفعال شد`
            );
          }
        } else {
          console.log(`[notificationService] کاربر ${userId} subscription فعالی ندارد`);
        }
      } catch (pushError) {
        console.error('[notificationService] خطا در ارسال Push:', pushError.message);
        // Push خطا ندهد — اعلان DB ذخیره شده
      }
    }

    // ─── مرحله ۳: ارسال پیامک ───
    if (sendSMS) {
      try {
        // شماره موبایل کاربر
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { mobile: true },
        });

        if (user?.mobile) {
          const template = SMS_TEMPLATES[type];
          const smsText = template ? template(data) : message;

          result.smsResult = await smsService.sendSMS(user.mobile, smsText);
        } else {
          console.log(`[notificationService] کاربر ${userId} شماره موبایل ندارد — پیامک ارسال نشد`);
          result.smsResult = { skipped: true, reason: 'no_mobile' };
        }
      } catch (smsError) {
        console.error('[notificationService] خطا در ارسال پیامک:', smsError.message);
        result.smsResult = { success: false, error: smsError.message };
      }
    }

    return result;
  } catch (error) {
    console.error('[notificationService] خطای کلی در notify():', error);
    throw error;
  }
}

/**
 * ارسال اعلان به چند کاربر
 * @param {object}  params       — همان پارامترهای notify() (به جز userId)
 * @param {string[]} userIds     — آرایه شناسه کاربران
 * @returns {Promise<object[]>}
 */
async function notifyMultiple(params, userIds) {
  const results = await Promise.allSettled(
    userIds.map((userId) => notify({ ...params, userId }))
  );

  return results.map((r, i) => ({
    userId: userIds[i],
    success: r.status === 'fulfilled',
    result: r.status === 'fulfilled' ? r.value : { error: r.reason?.message },
  }));
}

/**
 * علامت‌گذاری اعلان‌ها به عنوان خوانده‌شده
 * @param {string}   userId          — شناسه کاربر
 * @param {string[]} [notificationIds] — آرایه شناسه اعلان‌ها (خالی = همه)
 */
async function markAsRead(userId, notificationIds = []) {
  const where = { userId, isRead: false };
  if (notificationIds.length > 0) {
    where.id = { in: notificationIds };
  }
  return prisma.notification.updateMany({ where, data: { isRead: true } });
}

/**
 * حذف اعلان
 * @param {string} notificationId
 * @param {string} userId         — برای احراز مالکیت
 */
async function deleteNotification(notificationId, userId) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

/**
 * دریافت اعلان‌های کاربر با صفحه‌بندی
 */
async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * شمارش اعلان‌های خوانده‌نشده کاربر
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

module.exports = {
  notify,
  notifyMultiple,
  markAsRead,
  deleteNotification,
  getUserNotifications,
  getUnreadCount,
  NOTIFICATION_TYPES,
  SMS_TEMPLATES,
};
