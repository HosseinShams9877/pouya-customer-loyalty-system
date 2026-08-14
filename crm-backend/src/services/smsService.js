/**
 * Hepikal SMS Service
 * ارسال پیامک از طریق API هپی‌کال
 * Docs: https://docs.hepikal.com
 */

const axios = require('axios');

// ──────────────────────────────────────────────
// Config — از .env خوانده می‌شود
// ──────────────────────────────────────────────
const HEPIKAL_BASE_URL = process.env.HEPIKAL_BASE_URL || 'https://api.hepikal.com/v1';
const HEPIKAL_API_KEY  = process.env.HEPIKAL_API_KEY;
const HEPIKAL_SENDER   = process.env.HEPIKAL_SENDER || '3000XXXXX';

// محدودیت‌های عملیاتی
const MAX_RETRIES        = 3;
const RETRY_DELAY_MS     = 1000;
const RATE_LIMIT_PER_SEC = 30; // حداکثر ۳۰ درخواست در ثانیه

/**
 * تاخیر بین ریکوئست‌ها برای رعایت Rate Limit
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ارسال پیامک به یک شماره
 * @param {string} to       — شماره گیرنده (مثلاً 09121234567)
 * @param {string} message  — متن پیامک
 * @param {object} options  — گزینه‌های اضافی
 * @returns {Promise<object>} نتیجه ارسال از هپی‌کال
 */
async function sendSMS(to, message, options = {}) {
  if (!HEPIKAL_API_KEY) {
    console.warn('[smsService] HEPIKAL_API_KEY تنظیم نشده — پیامک ارسال نمی‌شود (DRY RUN)');
    console.log(`[smsService] DRY RUN → to: ${to}, message: ${message.substring(0, 80)}...`);
    return {
      success: true,
      dryRun: true,
      to,
      messageId: `dry_${Date.now()}`,
      status: 'simulated',
    };
  }

  // پاک‌سازی شماره
  const cleanNumber = normalizePhone(to);
  if (!cleanNumber) {
    throw new Error(`شماره نامعتبر: ${to}`);
  }

  const payload = {
    receptor: cleanNumber,
    message,
    sender: options.sender || HEPIKAL_SENDER,
    // هپی‌کال از این فیلدها پشتیبانی می‌کند:
    type: options.type || 1,           // 1 = عادی، 2 = اعتباری
    date: options.sendAt || null,       // ارسال در زمان مشخص (Unix timestamp)
    localid: options.localId || null,   // شناسه محلی برای跟踪
  };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${HEPIKAL_BASE_URL}/sms/send`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': HEPIKAL_API_KEY,
          },
          timeout: 10000, // ۱۰ ثانیه تایم‌اوت
        }
      );

      const result = response.data;
      console.log(`[smsService] پیامک ارسال شد → messageId: ${result?.messageId || 'N/A'}, to: ${cleanNumber}`);

      return {
        success: true,
        dryRun: false,
        messageId: result?.messageId || result?.id,
        status: result?.status || 'sent',
        cost: result?.cost || null,
        to: cleanNumber,
      };
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const data = error.response?.data;

      // خطاهای ۴xx (به جز 429) نیازی به ریت‌ری ندارند
      if (status && status >= 400 && status < 500 && status !== 429) {
        console.error(`[smsService] خطای کلاینت (${status}):`, data?.message || error.message);
        throw new Error(`خطای هپی‌کال: ${data?.message || error.message}`);
      }

      // خطای 429 = Rate Limit → صبر کن و دوباره تلاش کن
      if (status === 429) {
        const retryAfter = parseInt(error.response?.headers?.['retry-after']) || 2;
        console.warn(`[smsService] Rate Limit — صبر ${retryAfter}s و تلاش مجدد (${attempt}/${MAX_RETRIES})`);
        await sleep(retryAfter * 1000);
        continue;
      }

      // خطاهای شبکه و 5xx → ریت‌ری
      console.warn(`[smsService] تلاش ${attempt}/${MAX_RETRIES} ناموفق:`, error.message);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`ارسال پیامک پس از ${MAX_RETRIES} تلاش ناموفق بود: ${lastError?.message}`);
}

/**
 * ارسال پیامک به چند شماره (بچ)
 * @param {string[]} recipients — آرایه شماره‌ها
 * @param {string}   message    — متن پیامک
 * @param {object}   options    — گزینه‌های اضافی
 * @returns {Promise<object>} خلاصه نتایج ارسال
 */
async function sendBulkSMS(recipients, message, options = {}) {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    details: [],
  };

  for (let i = 0; i < recipients.length; i++) {
    const to = recipients[i];
    try {
      const result = await sendSMS(to, message, options);
      results.sent++;
      results.details.push({ to, success: true, messageId: result.messageId });
    } catch (error) {
      results.failed++;
      results.details.push({ to, success: false, error: error.message });
      console.error(`[smsService] خطا در ارسال به ${to}:`, error.message);
    }

    // فاصله بین هر ارسال برای رعایت Rate Limit
    if (i < recipients.length - 1) {
      await sleep(Math.ceil(1000 / RATE_LIMIT_PER_SEC));
    }
  }

  console.log(`[smsService] ارسال بچ کامل: ${results.sent}/${results.total} موفق`);
  return results;
}

/**
 * دریافت وضعیت پیامک
 * @param {string} messageId — شناسه پیامک
 * @returns {Promise<object>} وضعیت پیامک
 */
async function getStatus(messageId) {
  if (!HEPIKAL_API_KEY) {
    return { messageId, status: 'delivered', dryRun: true };
  }

  try {
    const response = await axios.get(`${HEPIKAL_BASE_URL}/sms/status`, {
      params: { messageId },
      headers: { 'apikey': HEPIKAL_API_KEY },
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error(`[smsService] خطا در دریافت وضعیت ${messageId}:`, error.message);
    throw error;
  }
}

/**
 * بررسی اعتبار حساب هپی‌کال
 * @returns {Promise<object>} اطلاعات اعتبار
 */
async function checkCredit() {
  if (!HEPIKAL_API_KEY) {
    return { credit: Infinity, currency: 'IRR', dryRun: true };
  }

  try {
    const response = await axios.get(`${HEPIKAL_BASE_URL}/account/credit`, {
      headers: { 'apikey': HEPIKAL_API_KEY },
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('[smsService] خطا در بررسی اعتبار:', error.message);
    throw error;
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * نرمال‌سازی شماره تلفن ایرانی
 * ورودی‌های ممکن: 09121234567, +989121234567, 00989121234567, 9121234567
 * خروجی: 09121234567
 */
function normalizePhone(raw) {
  if (!raw) return null;
  let cleaned = String(raw).replace(/[^0-9]/g, '');

  // حذف پیش‌شمارده بین‌المللی
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.substring(4);
  }
  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.substring(3);
  }

  // اعتبارسنجی: شماره موبایل ایرانی باید با 09 شروع شود و ۱۱ رقم باشد
  if (/^09[0-9]{9}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

module.exports = {
  sendSMS,
  sendBulkSMS,
  getStatus,
  checkCredit,
  normalizePhone,
};
