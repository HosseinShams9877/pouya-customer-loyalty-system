// ============================================================================
// Mock Data — داده‌های نمونه برای پیش‌نمایش بدون بک‌اند
// ============================================================================

const today = new Date();
const d = (daysAgo = 0, hours = 9) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(hours, 0, 0, 0);
  return dt.toISOString();
};

export const MOCK_USER = {
  id: 'u1',
  firstName: 'علی',
  lastName: 'محمدی',
  email: 'admin@loyalty.com',
  mobile: '09121234567',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: d(120),
};

export const MOCK_USERS = [
  MOCK_USER,
  { id: 'u2', firstName: 'مریم', lastName: 'حسینی', email: 'maryam@loyalty.com', mobile: '09129876543', role: 'SALES_REP', status: 'ACTIVE', createdAt: d(90) },
];

export const MOCK_LEADS = [
  { id: 'l1', fullName: 'رضا احمدی', mobile: '09121111111', company: 'ساختمان‌سازی آفتاب', source: 'website', stage: 'INQUIRY', estimatedValue: 450000000, projectId: 'p1', projectName: 'برج آفتاب', productType: 'یونولیت سقفی', createdAt: d(0), assignedTo: 'u1', assignedToName: 'علی محمدi', description: 'استعلام قیمت یونولیت سقفی برای ۲۰ واحد', lostReason: null, competitorPrice: null },
  { id: 'l2', fullName: 'محمد حسینی', mobile: '09122222222', company: 'پیمانکاران نوین', source: 'call', stage: 'CONSULTING', estimatedValue: 780000000, projectId: 'p2', projectName: 'مجتمع نور', productType: 'پنل سه‌بعدی', createdAt: d(1), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'مشاوره درباره پنل سه‌بعدی برای نمای ساختمان', lostReason: null, competitorPrice: null },
  { id: 'l3', fullName: 'حسن کریمی', mobile: '09123333333', company: 'گروه ساختمانی پارس', source: 'instagram', stage: 'PROFORMA', estimatedValue: 1200000000, projectId: 'p3', projectName: 'پارس برج', productType: 'یونولیت سقفی', createdAt: d(3), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'پیش‌فاکتور صادر شده، منتظر تایید مشتری', lostReason: null, competitorPrice: null },
  { id: 'l4', fullName: 'سارا رضایی', mobile: '09124444444', company: 'آرام سازان', source: 'referral', stage: 'WON', estimatedValue: 650000000, projectId: 'p4', projectName: 'ویلای آرام', productType: 'پنل سه‌بعدی', createdAt: d(10), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'قرارداد امضا شد', lostReason: null, competitorPrice: null },
  { id: 'l5', fullName: 'امیر نوری', mobile: '09125555555', company: 'سازه گستر', source: 'walk_in', stage: 'LOST', estimatedValue: 350000000, projectId: 'p5', projectName: 'سازه گستر مجتمع', productType: 'یونولیت سقفی', createdAt: d(15), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'قیمت بالاتر از رقیب', lostReason: 'PRICE', competitorPrice: 300000000 },
  { id: 'l6', fullName: 'فاطمه عباسی', mobile: '09126666666', company: null, source: 'website', stage: 'INQUIRY', estimatedValue: 200000000, projectId: null, projectName: null, productType: 'یونولیت سقفی', createdAt: d(0), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'استعلام برای یک واحد مسکونی', lostReason: null, competitorPrice: null },
  { id: 'l7', fullName: 'کیان شریفی', mobile: '09127777777', company: 'آسمان سازان', source: 'call', stage: 'CONSULTING', estimatedValue: 900000000, projectId: 'p2', projectName: 'مجتمع نور', productType: 'پنل سه‌بعدی', createdAt: d(2), assignedTo: 'u1', assignedToName: 'علی محمدی', description: 'درخواست نمونه و کاتالوگ', lostReason: null, competitorPrice: null },
];

export const MOCK_PROJECTS = [
  { id: 'p1', title: 'برج آفتاب', city: 'تهران', area: 2500, status: 'SKELETON', executor: 'رضا احمدی', budget: 2000000000, createdAt: d(5) },
  { id: 'p2', title: 'مجتمع نور', city: 'اصفهان', area: 5000, status: 'EXCAVATION', executor: 'محمد حسینی', budget: 5000000000, createdAt: d(10) },
  { id: 'p3', title: 'پارس برج', city: 'شیراز', area: 3500, status: 'FINISHING', executor: 'حسن کریمی', budget: 3500000000, createdAt: d(20) },
  { id: 'p4', title: 'ویلای آرام', city: 'لواسان', area: 800, status: 'FINISHING', executor: 'سارا رضایی', budget: 800000000, createdAt: d(30) },
];

export const MOCK_CUSTOMERS = [
  { id: 'c1', fullName: 'رضا احمدی', mobile: '09121111111', company: 'ساختمان‌سازی آفتاب', status: 'ACTIVE', city: 'تهران', totalPurchase: 3200000000, totalPoints: 3450, walletBalance: 500000, avgDaysBetween: 18, daysSinceLast: 12, invoicesCount: 8, createdAt: d(60) },
  { id: 'c2', fullName: 'محمد حسینی', mobile: '09122222222', company: 'پیمانکاران نوین', status: 'IN_RISK', city: 'اصفهان', totalPurchase: 1500000000, totalPoints: 1680, walletBalance: 0, avgDaysBetween: 22, daysSinceLast: 38, invoicesCount: 5, createdAt: d(90) },
  { id: 'c3', fullName: 'حسن کریمی', mobile: '09123333333', company: 'گروه ساختمانی پارس', status: 'ACTIVE', city: 'شیراز', totalPurchase: 5600000000, totalPoints: 5900, walletBalance: 1000000, avgDaysBetween: 15, daysSinceLast: 8, invoicesCount: 12, createdAt: d(120) },
  { id: 'c4', fullName: 'سارا رضایی', mobile: '09124444444', company: 'آرام سازان', status: 'CHURNED', city: 'تهران', totalPurchase: 900000000, totalPoints: 950, walletBalance: 0, avgDaysBetween: 25, daysSinceLast: 65, invoicesCount: 3, createdAt: d(150) },
  { id: 'c5', fullName: 'امیر نوری', mobile: '09125555555', company: 'سازه گستر', status: 'ACTIVE', city: 'کرج', totalPurchase: 2100000000, totalPoints: 2300, walletBalance: 500000, avgDaysBetween: 20, daysSinceLast: 15, invoicesCount: 6, createdAt: d(80) },
  { id: 'c6', fullName: 'فاطمه عباسی', mobile: '09126666666', company: null, status: 'NEW', city: 'تهران', totalPurchase: 0, totalPoints: 0, walletBalance: 0, avgDaysBetween: null, daysSinceLast: null, invoicesCount: 0, createdAt: d(2) },
];

export const MOCK_INVOICES = [
  { id: 'inv1', invoiceNumber: 'INV-1404-001', customerId: 'c1', customerName: 'رضا احمدی', amount: 450000000, paymentType: 'CASH', paymentStatus: 'PAID', source: 'MANUAL', delayDays: 0, paymentDate: d(5), createdAt: d(5), loyalty: { purchasePoints: 450, cashBonus: 50, financialBonus: 20, totalPoints: 520 } },
  { id: 'inv2', invoiceNumber: 'INV-1404-002', customerId: 'c2', customerName: 'محمد حسینی', amount: 780000000, paymentType: 'CREDIT', paymentStatus: 'PAID', source: 'MANUAL', delayDays: 5, paymentDate: d(7), createdAt: d(12), loyalty: { purchasePoints: 780, cashBonus: 0, financialBonus: 0, totalPoints: 780 } },
  { id: 'inv3', invoiceNumber: 'SPD-1404-101', customerId: 'c3', customerName: 'حسن کریمی', amount: 1200000000, paymentType: 'CASH', paymentStatus: 'PAID', source: 'SEPIDAR_EXCEL', delayDays: 0, paymentDate: d(20), createdAt: d(20), loyalty: { purchasePoints: 1200, cashBonus: 50, financialBonus: 20, totalPoints: 1270 } },
  { id: 'inv4', invoiceNumber: 'INV-1404-004', customerId: 'c1', customerName: 'رضا احمدی', amount: 320000000, paymentType: 'CREDIT', paymentStatus: 'PENDING', source: 'MANUAL', delayDays: 0, paymentDate: null, createdAt: d(3), loyalty: { purchasePoints: 320, cashBonus: 0, financialBonus: 0, totalPoints: 320 } },
  { id: 'inv5', invoiceNumber: 'SPD-1404-102', customerId: 'c5', customerName: 'امیر نوری', amount: 600000000, paymentType: 'CASH', paymentStatus: 'OVERDUE', source: 'SEPIDAR_EXCEL', delayDays: 15, paymentDate: null, createdAt: d(30), loyalty: { purchasePoints: 600, cashBonus: 50, financialBonus: 0, totalPoints: 650 } },
  { id: 'inv6', invoiceNumber: 'INV-1404-006', customerId: 'c3', customerName: 'حسن کریمی', amount: 900000000, paymentType: 'CASH', paymentStatus: 'PAID', source: 'MANUAL', delayDays: 0, paymentDate: d(1), createdAt: d(1), loyalty: { purchasePoints: 900, cashBonus: 50, financialBonus: 20, totalPoints: 970 } },
];

export const MOCK_INTERACTIONS = [
  { id: 'i1', leadId: 'l1', type: 'CALL', description: 'تماس اولیه با مشتری. نیاز به ۲۰ مترمربع یونولیت سقفی دارد. درخواست کاتالوگ و لیست قیمت.', nextFollowUpDate: d(0, 14), createdAt: d(1), lead: { id: 'l1', fullName: 'رضا احمدی', mobile: '09121111111', stage: 'INQUIRY' } },
  { id: 'i2', leadId: 'l2', type: 'CALL', description: 'مشتری از کیفیت پنل سه‌بعدی سوال پرسید. قرار شد نمونه ارسال شود.', nextFollowUpDate: d(0, 10), createdAt: d(2), lead: { id: 'l2', fullName: 'محمد حسینی', mobile: '09122222222', stage: 'CONSULTING' } },
  { id: 'i3', leadId: 'l2', type: 'MEETING', description: 'جلسه حضوری در دفتر پیمانکاران نوین. بررسی نقشه و محاسبه متراژ.', nextFollowUpDate: d(0, 16), createdAt: d(3), lead: { id: 'l2', fullName: 'محمد حسینی', mobile: '09122222222', stage: 'CONSULTING' } },
  { id: 'i4', leadId: 'l3', type: 'MESSAGE', description: 'ارسال پیش‌فاکتور از طریق واتس‌اپ. مشتری گفت تا پایان هفته جواب می‌دهد.', nextFollowUpDate: d(-1, 10), createdAt: d(4), lead: { id: 'l3', fullName: 'حسن کریمی', mobile: '09123333333', stage: 'PROFORMA' } },
  { id: 'i5', leadId: 'l7', type: 'CALL', description: 'درخواست نمونه پنل و قیمت‌نامه.', nextFollowUpDate: d(0, 11), createdAt: d(1), lead: { id: 'l7', fullName: 'کیان شریفی', mobile: '09127777777', stage: 'CONSULTING' } },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'CHURNED_ALERT', title: 'ریزش مشتری', message: 'سارا رضایی (آرام سازان) ۶۵ روز بدون خرید است و در وضعیت ریزش قرار گرفته.', priority: 'HIGH', isRead: false, createdAt: d(0, 8) },
  { id: 'n2', type: 'FOLLOW_UP_REMINDER', title: 'یادآوری پیگیری', message: 'پیگیری با رضا احمدی (ساختمان‌سازی آفتاب) برای امروز ثبت شده.', priority: 'MEDIUM', isRead: false, createdAt: d(0, 7) },
  { id: 'n3', type: 'NEW_LEAD', title: 'سرنخ جدید', message: 'یک استعلام جدید از طریق وب‌سایت ثبت شده: فاطمه عباسی', priority: 'MEDIUM', isRead: false, createdAt: d(0, 6) },
  { id: 'n4', type: 'IN_RISK_ALERT', title: 'هشدار ریزش', message: 'محمد حسینی (پیمانکاران نوین) در معرض ریزش قرار دارد.', priority: 'HIGH', isRead: true, createdAt: d(1, 9) },
  { id: 'n5', type: 'LOYALTY_MILESTONE', title: 'جشنواره امتیاز', message: 'حسن کریمی به ۱۰۰۰ امتیاز رسید و ۵۰۰,۰۰۰ ریال به کیف پول او اضافه شد.', priority: 'LOW', isRead: true, createdAt: d(3, 10) },
  { id: 'n6', type: 'FOLLOW_UP_REMINDER', title: 'پیگیری سررسید گذشته', message: 'پیگیری با حسن کریمی که دیروز بود انجام نشده.', priority: 'HIGH', isRead: false, createdAt: d(1, 8) },
];

export const MOCK_CAMPAIGNS = [
  { id: 'camp1', title: 'جشنواره تخفیف عید فطر', message: 'مشتری گرامی، به مناسبت عید فطر ۱۰٪ تخفیف ویژه محصولات پویا پلاستیک. کد تخفیف: EID10', audienceType: 'ALL_ACTIVE', audienceLabel: 'همه مشتریان فعال', status: 'COMPLETED', totalRecipients: 45, sentCount: 43, failedCount: 2, completedAt: d(2), createdBy: 'u1', creator: { firstName: 'علی', lastName: 'محمدی' }, createdAt: d(2) },
  { id: 'camp2', title: 'پیشنهاد ویژه مشتریان طلایی', message: 'مشتری عزیز، با تشکر از اعتماد شما. ۱۵٪ تخفیف ویژه برای سفارش بعدی. کد: GOLD15', audienceType: 'GOLD', audienceLabel: 'مشتریان سطح طلایی', status: 'COMPLETED', totalRecipients: 8, sentCount: 8, failedCount: 0, completedAt: d(5), createdBy: 'u1', creator: { firstName: 'علی', lastName: 'محمدی' }, createdAt: d(5) },
  { id: 'camp3', title: 'بازگشت مشتریان در معرض ریزش', message: 'ما دلتنگ شما هستیم! ۲۰٪ تخفیف برای بازگشت. کد: COMEBACK20', audienceType: 'AT_RISK', audienceLabel: 'مشتریان در معرض ریزش', status: 'COMPLETED', totalRecipients: 3, sentCount: 2, failedCount: 1, completedAt: d(8), createdBy: 'u1', creator: { firstName: 'علی', lastName: 'محمدی' }, createdAt: d(8) },
];

export const MOCK_INVOICE_STATS = {
  totalAmount: 3350000000,
  totalInvoices: 5,
  paidInvoices: 3,
  pendingInvoices: 1,
  overdueInvoices: 1,
  totalLoyaltyPoints: 3540,
};

export const MOCK_PIPELINE_STATS = {
  INQUIRY: 3,
  CONSULTING: 2,
  PROFORMA: 1,
  WON: 1,
  LOST: 1,
};

export const MOCK_CEO_DASHBOARD = {
  kpis: {
    sales: { total: 4250000000, invoiceCount: 6, growth: 27, lastMonthTotal: 3350000000 },
    cashShare: { amount: 2550000000, percentage: 60 },
    newLeads: { count: 7 },
    csat: { average: 4.2, totalResponses: 9 },
    receivables: { overdueAmount: 600000000, overdueInvoices: 1 },
    reactivation: { count: 23 },
  },
  charts: {
    salesTrend: [
      { month: 'اسفند', monthShort: 'اسف', total: 1800000000 },
      { month: 'فروردین', monthShort: 'فرو', total: 2100000000 },
      { month: 'اردیبهشت', monthShort: 'ارد', total: 2800000000 },
      { month: 'خرداد', monthShort: 'خرد', total: 3200000000 },
      { month: 'تیر', monthShort: 'تیر', total: 3350000000 },
      { month: 'مرداد', monthShort: 'مرد', total: 4250000000 },
    ],
    lostReasons: [
      { reason: 'PRICE', count: 3 },
      { reason: 'COMPETITOR', count: 2 },
      { reason: 'LOST_CONTACT', count: 1 },
      { reason: 'OTHER', count: 1 },
    ],
  },
};

// ============================================================================
// Loyalty Club V2 — realistic B2B member experience
// ============================================================================

export const MOCK_TIERS = [
  { id: 'tier-base', code: 'BASE', audienceType: 'CONTRACTOR', title: 'پایه پیمانکار', description: 'شروع مسیر عضویت پیمانکاران', color: '#64748B', minPoints: 0, multiplier: 1, sortOrder: 1, benefits: ['امتیاز خرید', 'پیشنهادهای عمومی'], _count: { customers: 120 } },
  { id: 'tier-silver', code: 'SILVER', audienceType: 'CONTRACTOR', title: 'نقره‌ای', description: 'پیمانکاران فعال', color: '#94A3B8', minPoints: 1500, multiplier: 1.1, sortOrder: 2, benefits: ['۱۰٪ امتیاز بیشتر', 'تخفیف حمل دوره‌ای', 'پشتیبانی سریع‌تر'], _count: { customers: 214 } },
  { id: 'tier-gold', code: 'GOLD', audienceType: 'CONTRACTOR', title: 'طلایی', description: 'پیمانکاران ارزشمند', color: '#D97706', minPoints: 3500, multiplier: 1.25, sortOrder: 3, benefits: ['۲۵٪ امتیاز بیشتر', 'اعتبار خرید اختصاصی', 'تحویل اولویت‌دار'], _count: { customers: 86 } },
  { id: 'tier-special', code: 'SPECIAL', audienceType: 'CONTRACTOR', title: 'ویژه', description: 'بالاترین سطح پیمانکاران', color: '#7C3AED', minPoints: 7000, multiplier: 1.5, sortOrder: 4, benefits: ['۵۰٪ امتیاز بیشتر', 'مدیر حساب اختصاصی', 'شرایط اعتباری ویژه'], _count: { customers: 28 } },
  { id: 'tier-rep-c', code: 'REP_C', audienceType: 'REPRESENTATIVE', title: 'نماینده C', description: 'شروع همکاری شبکه فروش', color: '#64748B', minPoints: 0, multiplier: 1, sortOrder: 1, benefits: ['تخفیف پایه', 'ثبت پروژه در پورتال'], _count: { customers: 92 } },
  { id: 'tier-rep-b', code: 'REP_B', audienceType: 'REPRESENTATIVE', title: 'نماینده B', description: 'شبکه رو به رشد', color: '#0EA5E9', minPoints: 2500, multiplier: 1.15, sortOrder: 2, benefits: ['تخفیف پلکانی', 'اولویت مشاوره'], _count: { customers: 71 } },
  { id: 'tier-rep-a', code: 'REP_A', audienceType: 'REPRESENTATIVE', title: 'نماینده A', description: 'نمایندگان کلیدی', color: '#D97706', minPoints: 6000, multiplier: 1.3, sortOrder: 3, benefits: ['سهمیه فروش ویژه', 'حمایت بازاریابی'], _count: { customers: 34 } },
  { id: 'tier-rep-excellent', code: 'REP_EXCELLENT', audienceType: 'REPRESENTATIVE', title: 'نماینده ممتاز', description: 'شریک راهبردی پویا', color: '#7C3AED', minPoints: 12000, multiplier: 1.6, sortOrder: 4, benefits: ['بالاترین تخفیف', 'مدیر حساب اختصاصی', 'اولویت موجودی'], _count: { customers: 11 } },
];

const tierById = Object.fromEntries(MOCK_TIERS.map(t => [t.id, t]));
const memberTierIds = ['tier-gold', 'tier-silver', 'tier-special', 'tier-base', 'tier-silver', 'tier-base'];
export const MOCK_LOYALTY_MEMBERS = MOCK_CUSTOMERS.map((customer, index) => ({
  ...customer,
  membershipNo: `PP-1404-100${index + 1}`,
  referralCode: ['REZA1001', 'MOHA1002', 'HASA1003', 'SARA1004', 'AMIR1005', 'FATI1006'][index],
  memberStatus: 'ACTIVE',
  province: ['تهران', 'اصفهان', 'فارس', 'تهران', 'البرز', 'تهران'][index],
  joinedAt: customer.createdAt,
  lifetimePoints: [4650, 1880, 8200, 950, 2800, 120][index],
  redeemedPoints: [1200, 200, 2300, 0, 500, 0][index],
  expiredPoints: [0, 0, 0, 0, 0, 0][index],
  tierId: memberTierIds[index],
  tier: tierById[memberTierIds[index]],
  preferredChannel: 'SMS',
  marketingConsent: true,
  lastActivityAt: d([12, 38, 8, 65, 15, 2][index]),
}));

export const MOCK_REWARDS = [
  { id: 'rw1', code: 'SHIP-50', title: '۵۰٪ تخفیف حمل', description: 'تخفیف هزینه حمل سفارش بعدی تا سقف تعیین‌شده', type: 'SHIPPING', costPoints: 600, cashValue: 2500000, stock: null, redeemedCount: 18, imageIcon: 'truck', eligibleTier: null, validityDays: 30, fulfillmentMode: 'COUPON', isFeatured: true, isActive: true },
  { id: 'rw2', code: 'CREDIT-5M', title: '۵ میلیون ریال اعتبار خرید', description: 'شارژ مستقیم کیف پول برای سفارش بعدی', type: 'CREDIT', costPoints: 1000, cashValue: 5000000, stock: null, redeemedCount: 11, imageIcon: 'wallet', eligibleTier: null, validityDays: 45, fulfillmentMode: 'WALLET', isFeatured: true, isActive: true },
  { id: 'rw3', code: 'SAMPLE-KIT', title: 'پک نمونه محصولات', description: 'پک نمونه فنی محصولات منتخب برای پروژه', type: 'GIFT', costPoints: 450, cashValue: null, stock: 24, redeemedCount: 7, imageIcon: 'package', eligibleTier: null, validityDays: 30, fulfillmentMode: 'MANUAL', isFeatured: false, isActive: true },
  { id: 'rw4', code: 'TECH-CONSULT', title: 'جلسه مشاوره فنی پروژه', description: 'جلسه تخصصی محاسبه و انتخاب محصول', type: 'SERVICE', costPoints: 800, cashValue: null, stock: null, redeemedCount: 9, imageIcon: 'headphones', eligibleTier: null, validityDays: 60, fulfillmentMode: 'MANUAL', isFeatured: true, isActive: true },
  { id: 'rw5', code: 'PRIORITY-DELIVERY', title: 'تحویل اولویت‌دار', description: 'قرارگیری یک سفارش در صف تحویل اولویت‌دار', type: 'SERVICE', costPoints: 1400, cashValue: null, stock: 10, redeemedCount: 4, imageIcon: 'zap', eligibleTier: tierById['tier-gold'], validityDays: 30, fulfillmentMode: 'MANUAL', isFeatured: false, isActive: true },
  { id: 'rw6', code: 'CREDIT-20M', title: '۲۰ میلیون ریال اعتبار ویژه', description: 'پاداش اختصاصی اعضای سطح ویژه', type: 'CREDIT', costPoints: 3500, cashValue: 20000000, stock: 8, redeemedCount: 2, imageIcon: 'gem', eligibleTier: tierById['tier-special'], validityDays: 45, fulfillmentMode: 'WALLET', isFeatured: true, isActive: true },
];

export const MOCK_REDEMPTIONS = [
  { id: 'red1', trackingCode: 'PP-R-24081', customerId: 'c1', pointsCost: 1000, cashValue: 5000000, status: 'REQUESTED', requestedAt: d(0, 10), customer: MOCK_LOYALTY_MEMBERS[0], reward: MOCK_REWARDS[1] },
  { id: 'red2', trackingCode: 'PP-R-24079', customerId: 'c3', pointsCost: 600, cashValue: 2500000, status: 'APPROVED', requestedAt: d(1, 11), approvedAt: d(0, 9), customer: MOCK_LOYALTY_MEMBERS[2], reward: MOCK_REWARDS[0] },
  { id: 'red3', trackingCode: 'PP-R-24070', customerId: 'c5', pointsCost: 450, cashValue: null, status: 'FULFILLED', requestedAt: d(5, 12), fulfilledAt: d(3, 14), customer: MOCK_LOYALTY_MEMBERS[4], reward: MOCK_REWARDS[2] },
];

export const MOCK_RULES = [
  { id: 'rule1', code: 'PURCHASE_BASE', title: 'امتیاز پایه خرید', description: 'هر یک میلیون ریال خرید، یک امتیاز', eventType: 'PURCHASE', conditions: {}, action: { type: 'POINTS_PER_AMOUNT', rialPerPoint: 1000000, value: 1 }, priority: 10, stackable: true, isActive: true },
  { id: 'rule2', code: 'CASH_BONUS', title: 'بونوس پرداخت نقدی', description: '۵۰ امتیاز اضافه برای پرداخت نقدی', eventType: 'INVOICE_PAID', conditions: { paymentType: 'CASH' }, action: { type: 'POINTS_FIXED', value: 50 }, priority: 15, stackable: true, isActive: true },
  { id: 'rule3', code: 'HIGH_VALUE', title: 'بونوس خرید عمده', description: '۲۰۰ امتیاز برای فاکتور بالای یک میلیارد ریال', eventType: 'PURCHASE', conditions: { minAmount: '1000000000' }, action: { type: 'POINTS_FIXED', value: 200 }, priority: 20, stackable: true, isActive: true },
  { id: 'rule4', code: 'GOLD_CASHBACK', title: 'کش‌بک اعضای طلایی', description: 'نیم درصد کش‌بک پرداخت نقدی اعضای طلایی و ویژه', eventType: 'INVOICE_PAID', conditions: { paymentType: 'CASH', tierCodes: ['GOLD', 'SPECIAL'] }, action: { type: 'CASHBACK_PERCENT', value: 0.5, cap: '10000000' }, priority: 30, stackable: true, isActive: true },
];

export const MOCK_MISSIONS = [
  { id: 'ms1', code: 'THREE-PURCHASES', title: 'سه خرید پیاپی', description: 'در دوره جاری سه فاکتور خرید ثبت کنید.', actionType: 'PURCHASE_COUNT', targetValue: 3, rewardPoints: 180, badge: 'repeat', isActive: true, _count: { participants: 12 }, participants: [{ progress: 2, status: 'IN_PROGRESS' }] },
  { id: 'ms2', code: 'BILLION-CLUB', title: 'باشگاه یک‌میلیاردی', description: 'مجموع خرید مأموریت را به یک میلیارد ریال برسانید.', actionType: 'PURCHASE_AMOUNT', targetValue: 1000, rewardPoints: 300, badge: 'target', isActive: true, _count: { participants: 8 }, participants: [{ progress: 720, status: 'IN_PROGRESS' }] },
  { id: 'ms3', code: 'REFERRAL-ONE', title: 'همکار جدید معرفی کنید', description: 'یک مشتری سازمانی جدید و واجد شرایط معرفی کنید.', actionType: 'REFERRAL', targetValue: 1, rewardPoints: 250, badge: 'users', isActive: true, _count: { participants: 5 }, participants: [{ progress: 0, status: 'IN_PROGRESS' }] },
  { id: 'ms4', code: 'PROFILE-COMPLETE', title: 'پروفایل حرفه‌ای', description: 'اطلاعات شرکت و علایق خرید خود را کامل کنید.', actionType: 'PROFILE', targetValue: 1, rewardPoints: 80, badge: 'profile', isActive: true, _count: { participants: 19 }, participants: [{ progress: 1, status: 'COMPLETED' }] },
];

export const MOCK_SEGMENTS = [
  { id: 'seg1', code: 'VIP', title: 'ارزشمندترین اعضا', description: 'بیش از ۳۵۰۰ امتیاز طول عمر', color: '#D97706', criteria: { minLifetimePoints: 3500 }, isDynamic: true, isActive: true, memberCount: 2 },
  { id: 'seg2', code: 'AT_RISK', title: 'در معرض ریزش', description: 'نیازمند پیشنهاد بازگشت', color: '#EF4444', criteria: { status: 'IN_RISK' }, isDynamic: true, isActive: true, memberCount: 1 },
  { id: 'seg3', code: 'NEW_MEMBERS', title: 'اعضای جدید', description: 'حداکثر یک خرید ثبت‌شده', color: '#0EA5E9', criteria: { maxInvoicesCount: 1 }, isDynamic: true, isActive: true, memberCount: 1 },
  { id: 'seg4', code: 'LOYAL_ACTIVE', title: 'وفادار فعال', description: 'حداقل پنج خرید و فعالیت اخیر', color: '#10B981', criteria: { minInvoicesCount: 5, maxDaysSinceLast: 30 }, isDynamic: true, isActive: true, memberCount: 3 },
];

export const MOCK_POINT_TRANSACTIONS = [
  { id: 'pt1', customerId: 'c1', type: 'EARN', sourceType: 'INVOICE', sourceId: 'inv6', points: 970, balanceAfter: 3450, description: 'امتیاز فاکتور INV-1404-006', expiresAt: d(-330), createdAt: d(1), customer: MOCK_LOYALTY_MEMBERS[0] },
  { id: 'pt2', customerId: 'c1', type: 'REDEEM', sourceType: 'REWARD', sourceId: 'red1', points: -1000, balanceAfter: 2480, description: 'دریافت پاداش «۵ میلیون ریال اعتبار خرید»', createdAt: d(2), customer: MOCK_LOYALTY_MEMBERS[0] },
  { id: 'pt3', customerId: 'c3', type: 'EARN', sourceType: 'INVOICE', sourceId: 'inv3', points: 1587, balanceAfter: 5900, description: 'امتیاز فاکتور SPD-1404-101', expiresAt: d(-345), createdAt: d(20), customer: MOCK_LOYALTY_MEMBERS[2] },
  { id: 'pt4', customerId: 'c5', type: 'EARN', sourceType: 'MISSION', sourceId: 'ms1', points: 180, balanceAfter: 2300, description: 'پاداش مأموریت سه خرید پیاپی', createdAt: d(4), customer: MOCK_LOYALTY_MEMBERS[4] },
];

export const MOCK_MEMBER_SUMMARY = {
  ...MOCK_LOYALTY_MEMBERS[0],
  nextTier: tierById['tier-special'],
  pointsToNextTier: 2350,
  expiringPoints: 520,
  missionProgress: MOCK_MISSIONS.map(m => ({ id: `cmp-${m.id}`, progress: m.participants[0].progress, status: m.participants[0].status, mission: m })),
  redemptions: MOCK_REDEMPTIONS.filter(r => r.customerId === 'c1'),
};

export const MOCK_REFERRALS = [
  { id: 'ref1', referrerId: 'c1', referredMobile: '09127777777', status: 'QUALIFIED', rewardPoints: 250, createdAt: d(15), qualifiedAt: d(5) },
  { id: 'ref2', referrerId: 'c1', referredMobile: '09128888888', status: 'JOINED', rewardPoints: 0, createdAt: d(8) },
];

export const MOCK_RETENTION_REPORT = {
  rules: { inRiskMultiplier: 1.5, churnMultiplier: 2.5, inactiveDays: 90, reactivationWindowSize: 250, runAt: '02:00' },
  counts: { total: 1284, active: 1016, atRisk: 18, churned: 250 },
  atRiskCustomers: [
    { ...MOCK_LOYALTY_MEMBERS[1], churnThresholdDays: 33, assignedTo: { firstName: 'مریم', lastName: 'حسینی' } },
    { ...MOCK_LOYALTY_MEMBERS[3], status: 'IN_RISK', daysSinceLast: 65, churnThresholdDays: 38, assignedTo: { firstName: 'علی', lastName: 'محمدی' } },
    { ...MOCK_LOYALTY_MEMBERS[4], status: 'IN_RISK', daysSinceLast: 34, churnThresholdDays: 30, assignedTo: { firstName: 'مریم', lastName: 'حسینی' } },
  ],
};

export const MOCK_REPRESENTATIVES = [
  { id: 'rep1', code: 'REP-KRM-001', grade: 'A', discountRate: 7.5, region: 'کرمان و جنوب شرق', status: 'ACTIVE', customer: { id: 'rc1', fullName: 'کیان شریفی', company: 'نمایندگی آسمان سازان', mobile: '09127777777', totalPurchase: 7200000000, lifetimePoints: 6800, tier: tierById['tier-rep-a'] }, _count: { registrations: 18 } },
  { id: 'rep2', code: 'REP-THR-014', grade: 'EXCELLENT', discountRate: 10, region: 'تهران غرب', status: 'ACTIVE', customer: { id: 'rc2', fullName: 'مهدی رستگار', company: 'پخش سازه رستگار', mobile: '09128888888', totalPurchase: 12800000000, lifetimePoints: 14200, tier: tierById['tier-rep-excellent'] }, _count: { registrations: 31 } },
  { id: 'rep3', code: 'REP-FRS-008', grade: 'B', discountRate: 5, region: 'فارس', status: 'ACTIVE', customer: { id: 'rc3', fullName: 'علی اکبری', company: 'مصالح اکبری', mobile: '09129999991', totalPurchase: 4100000000, lifetimePoints: 3200, tier: tierById['tier-rep-b'] }, _count: { registrations: 12 } },
  { id: 'rep4', code: 'REP-YZD-003', grade: 'C', discountRate: 3, region: 'یزد', status: 'ACTIVE', customer: { id: 'rc4', fullName: 'سعید محمودی', company: 'سازه کویر', mobile: '09129999992', totalPurchase: 1900000000, lifetimePoints: 1100, tier: tierById['tier-rep-c'] }, _count: { registrations: 6 } },
];

export const MOCK_REPRESENTATIVE_REGISTRATIONS = [
  { id: 'rr1', contractorName: 'احمد مرادی', contractorMobile: '09121212121', contractorCompany: 'انبوه‌سازان آرمان', city: 'سیرجان', estimatedVolume: 780000000, status: 'PENDING', discountPercent: 0, pointsAwarded: 0, createdAt: d(0, 11), representative: MOCK_REPRESENTATIVES[0], project: { id: 'rp1', title: 'مجتمع مسکونی آرمان', status: 'SKELETON' } },
  { id: 'rr2', contractorName: 'ناصر زمانی', contractorMobile: '09123232323', contractorCompany: 'سازه ماندگار', city: 'تهران', estimatedVolume: 1350000000, status: 'APPROVED', discountPercent: 10, pointsAwarded: 300, createdAt: d(2, 9), approvedAt: d(1, 14), representative: MOCK_REPRESENTATIVES[1], project: { id: 'rp2', title: 'برج ماندگار', status: 'STRUCTURE' } },
  { id: 'rr3', contractorName: 'بهنام یوسفی', contractorMobile: '09124343434', contractorCompany: 'پارس بنا', city: 'شیراز', estimatedVolume: 620000000, status: 'REJECTED', discountPercent: 0, pointsAwarded: 0, reviewNote: 'اطلاعات پروژه کامل نیست', createdAt: d(4, 10), representative: MOCK_REPRESENTATIVES[2], project: { id: 'rp3', title: 'پروژه پارس', status: 'PLANNING' } },
];

export const MOCK_FEEDBACK = [
  { id: 'fb1', type: 'COMPLAINT', channel: 'HEPIKAL', subject: 'تأخیر در تحویل بار', description: 'مشتری از تغییر زمان تحویل انتقاد دارد.', status: 'OPEN', priority: 'HIGH', createdAt: d(0, 10), dueAt: new Date(Date.now()-2*3600000).toISOString(), slaBreached: true, customer: MOCK_LOYALTY_MEMBERS[1] },
  { id: 'fb2', type: 'SUGGESTION', channel: 'PHONE', subject: 'پیشنهاد بسته‌بندی مقاوم‌تر', description: 'نماینده درخواست تقویت بسته‌بندی پنل‌ها را ثبت کرد.', status: 'IN_PROGRESS', priority: 'NORMAL', createdAt: d(1, 13), dueAt: new Date(Date.now()+5*3600000).toISOString(), slaBreached: false, customer: MOCK_LOYALTY_MEMBERS[0] },
  { id: 'fb3', type: 'SURVEY', channel: 'SMS', subject: 'نظرسنجی پس از تماس', description: 'رضایت کامل از پاسخ‌گویی کارشناس فروش.', score: 5, status: 'CLOSED', priority: 'LOW', createdAt: d(2, 15), customer: MOCK_LOYALTY_MEMBERS[2] },
  { id: 'fb4', type: 'CALL_NOTE', channel: 'PHONE', subject: 'پیگیری نیاز پروژه', description: 'تماس تلفنی برای برآورد حجم یونولیت سقفی.', status: 'RESOLVED', priority: 'NORMAL', createdAt: d(3, 9), customer: MOCK_LOYALTY_MEMBERS[4] },
];

export const MOCK_LOYALTY_DASHBOARD = {
  kpis: { memberCount: 1284, activeMembers: 1027, activeRate: 80, spendablePoints: 248760, lifetimePoints: 384920, walletLiability: 685000000, totalPurchase: 486000000000, redemptionCount: 344, redemptionFulfillmentRate: 93, transactionCount: 6280 },
  tierDistribution: MOCK_TIERS.filter(tier => tier.audienceType === 'CONTRACTOR').map((tier, index) => ({ ...tier, members: [448, 314, 186, 64][index] })),
  recentRedemptions: MOCK_REDEMPTIONS,
  monthly: [
    { month: 'فروردین', earned: 18400, redeemed: 9200 }, { month: 'اردیبهشت', earned: 22600, redeemed: 11800 },
    { month: 'خرداد', earned: 25800, redeemed: 12900 }, { month: 'تیر', earned: 29200, redeemed: 15400 },
    { month: 'مرداد', earned: 34100, redeemed: 18600 }, { month: 'شهریور', earned: 38600, redeemed: 21300 },
  ],
};

// Business operations V2.2 — derived from the 138-question management questionnaire
export const MOCK_PRODUCTS = [
  { id:'prd1', code:'EPS-CEIL-10', title:'یونولیت سقفی دانسیته ۱۰', category:'CEILING_EPS', densityMin:10, densityMax:10, dimensions:{ lengths:[100,200], widths:[50], heights:[20,25] }, basePrice:1850000, priceUnit:'ریال / بلوک', priceUpdatedAt:d(1), isActive:true },
  { id:'prd2', code:'EPS-WALL-12', title:'یونولیت دیواری دانسیته ۱۲', category:'WALL_EPS', densityMin:12, densityMax:12, dimensions:{ lengths:[200], widths:[100], thicknesses:[3,5,10] }, basePrice:2450000, priceUnit:'ریال / ورق', priceUpdatedAt:d(1), isActive:true },
  { id:'prd3', code:'PANEL-3D', title:'پنل سه‌بعدی ساختمانی', category:'THREED_PANEL', densityMin:10, densityMax:15, dimensions:{ widths:[120], heights:[300] }, basePrice:9800000, priceUnit:'ریال / مترمربع', priceUpdatedAt:d(2), isActive:true },
  { id:'prd4', code:'EPS-BOX', title:'یخدان و بسته‌بندی یونولیتی', category:'PACKAGING', densityMin:15, densityMax:20, dimensions:{ custom:true }, basePrice:3200000, priceUnit:'ریال / عدد', priceUpdatedAt:d(4), isActive:true },
];

export const MOCK_PRICE_RULES = [
  { id:'pr1', code:'CASH-3', title:'تخفیف پرداخت نقدی', ruleType:'CASH', audienceType:'ALL', minAmount:100000000, discountPercent:3, maxDiscountRial:15000000, approvalRequired:false, isActive:true },
  { id:'pr2', code:'VOLUME-5', title:'تخفیف خرید حجمی', ruleType:'VOLUME', audienceType:'ALL', minAmount:1000000000, discountPercent:5, maxDiscountRial:60000000, approvalRequired:true, isActive:true },
  { id:'pr3', code:'PROJECT-7', title:'تخفیف پروژه تأییدشده', ruleType:'PROJECT', audienceType:'CONTRACTOR', minAmount:700000000, discountPercent:7, maxDiscountRial:75000000, approvalRequired:true, isActive:true },
  { id:'pr4', code:'REP-A-75', title:'قیمت نماینده سطح A', ruleType:'REPRESENTATIVE', audienceType:'REPRESENTATIVE', minAmount:0, discountPercent:7.5, approvalRequired:false, isActive:true },
  { id:'pr5', code:'GOLD-SHIP', title:'حمل اعضای طلایی', ruleType:'SHIPPING', audienceType:'CONTRACTOR', minAmount:800000000, discountPercent:100, maxDiscountRial:12000000, approvalRequired:true, isActive:true },
];

export const MOCK_SALES_TARGETS = [
  { id:'st1', period:'۱۴۰۵-۰۵', scopeType:'COMPANY', scopeLabel:'کل شرکت', targetAmount:6000000000, achievedAmount:4250000000, targetCashShare:70, achievedCashShare:60, targetNewLeads:25, achievedNewLeads:17, targetProjects:12, achievedProjects:8 },
  { id:'st2', period:'۱۴۰۵-۰۵', scopeType:'CHANNEL', scopeLabel:'فروش پروژه‌ای', targetAmount:3000000000, achievedAmount:2450000000, targetCashShare:65, achievedCashShare:58, targetNewLeads:14, achievedNewLeads:11, targetProjects:8, achievedProjects:6 },
  { id:'st3', period:'۱۴۰۵-۰۵', scopeType:'PROVINCE', scopeLabel:'کرمان و هرمزگان', targetAmount:1800000000, achievedAmount:1380000000, targetCashShare:75, achievedCashShare:68, targetNewLeads:8, achievedNewLeads:6, targetProjects:5, achievedProjects:4 },
];

export const MOCK_PURCHASE_REQUESTS = [
  { id:'req1', trackingCode:'REQ-24081', customerId:'c1', requestType:'INQUIRY', productTitle:'یونولیت سقفی دانسیته ۱۰', quantity:220, unit:'بلوک', projectName:'برج آفتاب', city:'تهران', description:'استعلام قیمت و زمان ارسال', status:'NEW', createdAt:d(0,10), customer:{ id:'c1', fullName:'رضا احمدی', mobile:'09121111111', company:'ساختمان‌سازی آفتاب' } },
  { id:'req2', trackingCode:'REQ-24076', customerId:'c3', requestType:'PURCHASE', productTitle:'پنل سه‌بعدی ساختمانی', quantity:640, unit:'مترمربع', projectName:'پارس برج', city:'شیراز', description:'درخواست پیش‌فاکتور رسمی', status:'QUOTED', createdAt:d(2,13), customer:{ id:'c3', fullName:'حسن کریمی', mobile:'09123333333', company:'گروه ساختمانی پارس' } },
  { id:'req3', trackingCode:'REQ-24072', customerId:'c5', requestType:'INQUIRY', productTitle:'یونولیت دیواری دانسیته ۱۲', quantity:95, unit:'ورق', projectName:'مجتمع سازه گستر', city:'کرج', description:'نیاز به مشاوره ابعاد', status:'CONTACTED', createdAt:d(4,9), customer:{ id:'c5', fullName:'امیر نوری', mobile:'09125555555', company:'سازه گستر' } },
];

export const MOCK_SHIPMENTS = [
  { id:'sh1', trackingCode:'SHIP-1405-081', customerId:'c3', invoiceNumber:'SPD-1404-101', origin:'سیرجان', destination:'شیراز', province:'فارس', transportCost:18000000, benefitType:'GOLD_FREE', benefitAmount:10000000, pointsUsed:600, status:'SENT', requiresApproval:false, createdAt:d(1), customer:{ ...MOCK_LOYALTY_MEMBERS[2] } },
  { id:'sh2', trackingCode:'SHIP-1405-079', customerId:'c1', invoiceNumber:'INV-1404-006', origin:'سیرجان', destination:'تهران', province:'تهران', transportCost:24000000, benefitType:'DISCOUNT', benefitAmount:6000000, pointsUsed:0, status:'DELIVERED', requiresApproval:false, createdAt:d(3), customer:{ ...MOCK_LOYALTY_MEMBERS[0] } },
  { id:'sh3', trackingCode:'SHIP-1405-083', customerId:'c2', invoiceNumber:'INV-1404-002', origin:'سیرجان', destination:'اصفهان', province:'اصفهان', transportCost:15000000, benefitType:'POINTS', benefitAmount:2500000, pointsUsed:500, status:'PLANNED', requiresApproval:true, createdAt:d(0), customer:{ ...MOCK_LOYALTY_MEMBERS[1] } },
];

export const MOCK_BUSINESS_DASHBOARD = {
  kpis:{ customers:400, activeCustomers:150, contractors:128, projects:47, openRequests:7, totalSales:4250000000, cashShare:60, transportCost:57000000, transportBenefit:18500000 },
  sourcePerformance:[
    { source:'project', total:28, won:14, lost:5, pipelineValue:6800000000, conversionRate:50 },
    { source:'representative', total:19, won:8, lost:4, pipelineValue:3900000000, conversionRate:42.1 },
    { source:'direct_call', total:13, won:4, lost:5, pipelineValue:1800000000, conversionRate:30.8 },
    { source:'website', total:9, won:2, lost:2, pipelineValue:920000000, conversionRate:22.2 },
    { source:'referral', total:7, won:3, lost:1, pipelineValue:1200000000, conversionRate:42.9 },
  ],
  seasonal:[{month:1,sales:2100000000},{month:2,sales:2400000000},{month:3,sales:2900000000},{month:4,sales:3350000000},{month:5,sales:4250000000},{month:6,sales:4600000000},{month:7,sales:3900000000},{month:8,sales:3100000000},{month:9,sales:2600000000},{month:10,sales:2200000000},{month:11,sales:1900000000},{month:12,sales:2050000000}],
  geography:[{province:'کرمان',count:148},{province:'هرمزگان',count:86},{province:'فارس',count:54},{province:'یزد',count:41},{province:'تهران',count:38},{province:'سایر',count:33}],
  targets:MOCK_SALES_TARGETS,
  questionnaireBaseline:{ registeredCustomers:400, activeCustomers:150, directShare:20, representativeShare:30, projectShare:50, peakSeason:'تابستان' },
};

export const MOCK_DUPLICATES = {
  candidates:[
    { matchKey:'company:آفتاب', confidence:85, customers:[{id:'dup1',fullName:'رضا احمدی',mobile:'09121111111',company:'ساختمان‌سازی آفتاب',totalPurchase:3200000000},{id:'dup2',fullName:'رضا احمدی ',mobile:'09121111112',company:'ساختمان سازی آفتاب',totalPurchase:450000000}] },
    { matchKey:'name:محمدحسینی', confidence:65, customers:[{id:'c2',fullName:'محمد حسینی',mobile:'09122222222',company:'پیمانکاران نوین',totalPurchase:1500000000},{id:'dup3',fullName:'محمدحسینی',mobile:'09122222229',company:'پیمانکاری نوین',totalPurchase:180000000}] },
  ], pending:[{id:'mr1',sourceCustomerId:'dup2',targetCustomerId:'dup1',reason:'نام شرکت و نام مشتری مشابه',status:'PENDING',createdAt:d(0)}]
};

// Route → mock data mapper
export function getMockResponse(url, method) {
  const path = url?.split('?')[0] || '';

  // Auth
  if (path === '/auth/login') return { data: { access_token: 'mock-token-123', refresh_token: 'mock-refresh', user: MOCK_USER } };
  if (path === '/auth/me') return { data: MOCK_USER };
  if (path === '/auth/refresh') return { data: { access_token: 'mock-token-new', expires_in: 3600 } };
  if (path === '/auth/logout') return { data: { success: true } };

  // Business operations V2.2
  if (path === '/business/dashboard') return { data: MOCK_BUSINESS_DASHBOARD };
  if (path === '/business/products' && method === 'get') return { data: MOCK_PRODUCTS };
  if (path === '/business/products' && method === 'post') return { data: { ...MOCK_PRODUCTS[0], id:'prd-new' }, message:'محصول به کاتالوگ اضافه شد' };
  if (path === '/business/price-rules' && method === 'get') return { data: MOCK_PRICE_RULES };
  if (path === '/business/price-rules' && method === 'post') return { data: { ...MOCK_PRICE_RULES[0], id:'pr-new' }, message:'قانون قیمت و تخفیف ثبت شد' };
  if (path === '/business/sales-targets' && method === 'get') return { data: MOCK_SALES_TARGETS };
  if (path === '/business/sales-targets' && method === 'post') return { data: { ...MOCK_SALES_TARGETS[0], id:'st-new' }, message:'هدف فروش ثبت شد' };
  if (path === '/business/contractors') return { data: MOCK_LOYALTY_MEMBERS.filter(item => item.customerType !== 'REPRESENTATIVE').map((item,index)=>({ ...item, _count:{ invoices:item.invoicesCount||index+2, networkRegistrations:index%3, purchaseRequests:index%2+1 } })) };
  if (path === '/business/purchase-requests' && method === 'get') return { data: MOCK_PURCHASE_REQUESTS };
  if (path.startsWith('/business/purchase-requests/') && method === 'patch') return { data:{ ...MOCK_PURCHASE_REQUESTS[0], status:'CONTACTED' }, message:'وضعیت درخواست به‌روزرسانی شد' };
  if (path === '/business/shipments' && method === 'get') return { data: MOCK_SHIPMENTS };
  if (path === '/business/shipments' && method === 'post') return { data:{ ...MOCK_SHIPMENTS[0], id:'sh-new' }, message:'ارسال ثبت شد' };
  if (path === '/business/data-quality/duplicates') return { data: MOCK_DUPLICATES };
  if (path === '/business/data-quality/merge-requests' && method === 'post') return { data:{ id:'mr-new', status:'PENDING' }, message:'درخواست ادغام در صف بررسی ایمن ثبت شد' };

  // Leads
  if (path === '/leads' && method === 'get') return { data: { items: MOCK_LEADS, pagination: { total: MOCK_LEADS.length, page: 1, pageSize: 20 } } };
  if (path.startsWith('/interactions/leads/l') && method === 'get') {
    const leadId = path.split('/')[3];
    return { data: { items: MOCK_INTERACTIONS.filter(i => i.leadId === leadId) } };
  }
  if (path.startsWith('/interactions/leads/l') && method === 'post') {
    return { data: { success: true } };
  }
  if (path.startsWith('/leads/l') && !path.includes('/interactions') && !path.includes('/stage') && !path.includes('/assign') && !path.includes('/stats')) {
    const leadId = path.split('/')[2];
    const lead = MOCK_LEADS.find(l => l.id === leadId) || MOCK_LEADS[0];
    return { data: lead };
  }
  if (path.includes('/leads/stats/pipeline')) return { data: MOCK_PIPELINE_STATS };
  if (path.startsWith('/leads/') && path.includes('/stage')) return { data: { success: true } };
  if (path === '/leads' && method === 'post') return { data: { success: true, id: 'l-new' } };

  // Interactions
  if (path === '/interactions/upcoming') return { data: { items: MOCK_INTERACTIONS.filter(i => i.nextFollowUpDate) } };

  // Projects
  if (path === '/projects' && method === 'get') return { data: { items: MOCK_PROJECTS, pagination: { total: MOCK_PROJECTS.length, page: 1, pageSize: 20 } } };
  if (path.startsWith('/projects/p') && method === 'get') {
    const pId = path.split('/')[2];
    return { data: MOCK_PROJECTS.find(p => p.id === pId) || MOCK_PROJECTS[0] };
  }

  // Customers
  if (path === '/customers' && method === 'get') return { data: { items: MOCK_LOYALTY_MEMBERS, pagination: { total: MOCK_LOYALTY_MEMBERS.length, page: 1, pageSize: 20 } } };
  if (path.startsWith('/customers/c') && method === 'get') {
    const customerId = path.split('/')[2];
    const customer = MOCK_LOYALTY_MEMBERS.find(c => c.id === customerId) || MOCK_LOYALTY_MEMBERS[0];
    return { data: { ...customer, pointTransactions: MOCK_POINT_TRANSACTIONS.filter(t => t.customerId === customer.id), redemptions: MOCK_REDEMPTIONS.filter(r => r.customerId === customer.id), missionProgress: MOCK_MEMBER_SUMMARY.missionProgress, referralsMade: MOCK_REFERRALS } };
  }

  // Invoices
  if (path === '/invoices' && method === 'get') {
    // Check for customerId query param for filtering
    const urlObj = new URL('http://dummy' + url);
    const customerId = urlObj.searchParams?.get('customerId');
    const filtered = customerId
      ? MOCK_INVOICES.filter(inv => inv.customerId === customerId)
      : MOCK_INVOICES;
    return { data: { items: filtered, pagination: { total: filtered.length, page: 1, pageSize: 20 } } };
  }
  if (path === '/invoices' && method === 'post') return { data: { success: true, loyalty: { purchasePoints: 100, cashBonus: 50, financialBonus: 20, totalPoints: 170 } } };
  if (path.startsWith('/invoices/inv')) return { data: MOCK_INVOICES[0] };
  if (path === '/invoices/stats') return { data: MOCK_INVOICE_STATS };

  // Loyalty
  if (path === '/loyalty/legacy-rules') return { data: { purchaseRialPerPoint: 1000000, cashBonusPoints: 50, financialBonusPoints: 20, wallet: { conversionThreshold: 1000, pointsPerConversion: 1000, rialPerConversion: 500000 } } };
  if (path.includes('/loyalty/customers/')) return { data: { totalPoints: 3450, walletBalance: 500000, history: [] } };

  // Churn
  if (path === '/churn/report') return { data: MOCK_RETENTION_REPORT };
  if (path === '/churn/rules') return { data: MOCK_RETENTION_REPORT.rules };
  if (path === '/churn/run') return { data: { processed: 1284, active: 1016, atRisk: 18, churned: 250, newlyAlerted: 7 } };
  if (path === '/retention/report') return { data: MOCK_RETENTION_REPORT };
  if (path === '/retention/reactivation' && method === 'get') return { data: { capacity: 250, count: 250, customers: MOCK_RETENTION_REPORT.atRiskCustomers } };
  if (path === '/retention/reactivation/campaign' && method === 'post') return { data: { id: 'camp-reactivation', status: 'DRAFT', totalRecipients: 250 }, message: 'کمپین بازگشت برای ۲۵۰ مشتری آماده شد' };
  if (path.startsWith('/retention/customers/') && path.endsWith('/reactivate')) return { data: { status: 'ACTIVE' }, message: 'مشتری به چرخه پیگیری فعال بازگشت' };

  // Loyalty Club V2 — admin
  if (path === '/loyalty/dashboard') return { data: MOCK_LOYALTY_DASHBOARD };
  if (path === '/loyalty/tiers' && method === 'get') return { data: MOCK_TIERS };
  if (path === '/loyalty/tiers' && method === 'post') return { data: { ...MOCK_TIERS[0], id: 'tier-new' }, message: 'سطح ایجاد شد' };
  if (path.startsWith('/loyalty/tiers/') && method === 'patch') return { data: { success: true } };
  if (path === '/loyalty/rules' && method === 'get') return { data: MOCK_RULES };
  if (path === '/loyalty/rules' && method === 'post') return { data: { ...MOCK_RULES[0], id: 'rule-new' }, message: 'قانون ایجاد شد' };
  if (path.startsWith('/loyalty/rules/') && method === 'patch') return { data: { success: true } };
  if (path === '/loyalty/rewards' && method === 'get') return { data: MOCK_REWARDS };
  if (path === '/loyalty/rewards' && method === 'post') return { data: { ...MOCK_REWARDS[0], id: 'rw-new' }, message: 'پاداش ایجاد شد' };
  if (path.startsWith('/loyalty/rewards/') && method === 'patch') return { data: { success: true } };
  if (path === '/loyalty/redemptions' && method === 'get') return { data: MOCK_REDEMPTIONS };
  if (path.includes('/loyalty/redemptions/') && path.endsWith('/status') && method === 'patch') return { data: { success: true }, message: 'وضعیت درخواست به‌روزرسانی شد' };
  if (path === '/loyalty/missions' && method === 'get') return { data: MOCK_MISSIONS };
  if (path === '/loyalty/missions' && method === 'post') return { data: { ...MOCK_MISSIONS[0], id: 'ms-new' }, message: 'مأموریت ایجاد شد' };
  if (path.startsWith('/loyalty/missions/') && method === 'patch') return { data: { success: true } };
  if (path === '/loyalty/segments' && method === 'get') return { data: MOCK_SEGMENTS };
  if (path === '/loyalty/segments' && method === 'post') return { data: { ...MOCK_SEGMENTS[0], id: 'seg-new' }, message: 'بخش ایجاد شد' };
  if (path === '/loyalty/transactions') return { data: MOCK_POINT_TRANSACTIONS };
  if (path === '/loyalty/offers') return { data: [] };

  // Representative network and portal
  if (path === '/representatives' && method === 'get') return { data: MOCK_REPRESENTATIVES };
  if (path === '/representatives/registrations' && method === 'get') return { data: MOCK_REPRESENTATIVE_REGISTRATIONS };
  if (path.startsWith('/representatives/registrations/') && path.endsWith('/review') && method === 'patch') return { data: { ...MOCK_REPRESENTATIVE_REGISTRATIONS[0], status: 'APPROVED', pointsAwarded: 300, discountPercent: 7.5 }, message: 'پروژه تأیید و پاداش معرفی ثبت شد' };
  if (path === '/representatives/portal/me') return { data: { ...MOCK_REPRESENTATIVES[0], registrations: MOCK_REPRESENTATIVE_REGISTRATIONS.filter(item => item.representative.id === 'rep1') } };
  if (path === '/representatives/portal/registrations' && method === 'post') return { data: { ...MOCK_REPRESENTATIVE_REGISTRATIONS[0], id: 'rr-new' }, message: 'پیمانکار و پروژه برای بررسی تخفیف نمایندگی ثبت شد' };

  // Voice of customer
  if (path === '/feedback' && method === 'get') return { data: MOCK_FEEDBACK };
  if (path === '/feedback/stats') return { data: { total: 186, open: 14, complaints: 38, suggestions: 52, breached: 3, csatAverage: 4.4 } };
  if (path === '/feedback' && method === 'post') return { data: { ...MOCK_FEEDBACK[0], id: 'fb-new' }, message: 'بازخورد مشتری ثبت شد' };
  if (path.startsWith('/feedback/') && method === 'patch') return { data: { success: true } };

  // Member portal — OTP is simulated in demo mode
  if (path === '/member/auth/request-otp' && method === 'post') return { data: { accepted: true, mobile: '09121111111', expiresIn: 180, demoCode: '123456' }, message: 'کد ورود نمایشی ارسال شد' };
  if (path === '/member/auth/verify-otp' && method === 'post') return { data: { accessToken: 'mock-member-token', expiresIn: 43200, member: { id: 'c1', fullName: 'رضا احمدی', mobile: '09121111111' } } };
  if (path === '/member/me') return { data: MOCK_MEMBER_SUMMARY };
  if (path === '/member/transactions') return { data: { points: MOCK_POINT_TRANSACTIONS.filter(t => t.customerId === 'c1'), wallet: [] } };
  if (path === '/member/wallet/convert' && method === 'post') return { data: { convertedPoints: 1000, walletCredit: 500000, pointBalanceAfter: 2450, walletBalanceAfter: 1000000 }, message: 'امتیاز به اعتبار ریالی کیف پول تبدیل شد' };
  if (path === '/member/rewards' && method === 'get') return { data: MOCK_REWARDS.map(reward => ({ ...reward, canRedeem: MOCK_MEMBER_SUMMARY.totalPoints >= reward.costPoints })) };
  if (path.startsWith('/member/rewards/') && path.endsWith('/redeem') && method === 'post') return { data: MOCK_REDEMPTIONS[0], message: 'درخواست پاداش ثبت شد' };
  if (path === '/member/redemptions') return { data: MOCK_REDEMPTIONS.filter(r => r.customerId === 'c1') };
  if (path === '/member/missions') return { data: MOCK_MISSIONS };
  if (path.startsWith('/member/missions/') && path.endsWith('/claim') && method === 'post') return { data: { points: 80, balanceAfter: 3530 }, message: 'پاداش مأموریت دریافت شد' };
  if (path === '/member/referrals' && method === 'get') return { data: { referralCode: 'REZA1001', referrals: MOCK_REFERRALS } };
  if (path === '/member/referrals' && method === 'post') return { data: { id: 'ref-new', status: 'INVITED' }, message: 'دعوت ثبت شد' };
  if (path === '/member/purchase-requests' && method === 'get') return { data: MOCK_PURCHASE_REQUESTS.filter(item => item.customerId === 'c1') };
  if (path === '/member/purchase-requests' && method === 'post') return { data: { ...MOCK_PURCHASE_REQUESTS[0], id:`req-${Date.now()}`, status:'NEW', createdAt:new Date().toISOString() }, message:'درخواست ثبت شد؛ کارشناس فروش با شما تماس می‌گیرد' };

  // Notifications
  if (path === '/notifications' && method === 'get') return { data: { items: MOCK_NOTIFICATIONS, pagination: { total: MOCK_NOTIFICATIONS.length, page: 1, pageSize: 20 } } };
  if (path === '/notifications/unread-count') return { data: { count: 4 } };
  if (path === '/notifications/push-public-key') return { data: { publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-GV3WVDRJxPO7Kh0uTDUAWJH1M6a3L7b6K3kF0c' } };
  if (path === '/notifications/subscribe' && method === 'post') return { data: { success: true, message: 'اشتراک ثبت شد' } };
  if (path === '/notifications/subscribe' && method === 'delete') return { data: { success: true, message: 'اشتراک لغو شد' } };
  if (path.includes('/read-all')) return { data: { success: true } };
  if (path.includes('/read')) return { data: { success: true } };
  if (method === 'delete') return { data: { success: true } };

  // CSAT (عمومی — بدون توکن)
  if (path.startsWith('/csat/admin/stats')) return { data: { total: 12, submitted: 9, pending: 3, responseRate: 75, averageScore: 4.2, distribution: [{ score: 1, count: 0 }, { score: 2, count: 1 }, { score: 3, count: 1 }, { score: 4, count: 3 }, { score: 5, count: 4 }] } };
  if (path.startsWith('/csat/') && method === 'get') return { data: { token: path.split('/').pop(), status: 'PENDING', leadName: 'رضا احمدی', company: 'ساختمان‌سازی آفتاب', expiresAt: new Date(Date.now() + 7*86400000).toISOString() } };
  if (path.startsWith('/csat/') && method === 'post') return { data: { success: true, score: null, message: 'امتیاز ثبت شد' } };

  // Campaigns
  if (path === '/campaigns' && method === 'get') return { data: { items: MOCK_CAMPAIGNS, pagination: { total: MOCK_CAMPAIGNS.length, page: 1, pageSize: 20 } } };
  if (path === '/campaigns' && method === 'post') return { data: { success: true, id: 'camp-new', title: 'کمپین جدید', sentCount: 3, failedCount: 0, status: 'COMPLETED' } };

  // Settings
  if (path === '/settings/loyalty' && method === 'get') return { data: { purchaseRialPerPoint: 1000000, cashBonusPoints: 50, financialBonusPoints: 20, walletConversionThreshold: 1000, walletRialPerConversion: 500000, projectReferralPoints: 300 } };
  if (path === '/settings' && method === 'get') return { data: { loyalty: [{ key: 'purchaseRialPerPoint', value: '1000000', label: 'ریال خرید به ازای هر امتیاز', isCustom: false }] } };
  if (path === '/settings/loyalty' && method === 'put') return { data: [{ key: 'purchaseRialPerPoint', value: '1000000' }], message: 'تنظیمات ذخیره شد' };

  // CEO Dashboard
  if (path === '/stats/ceo-dashboard') return { data: MOCK_CEO_DASHBOARD };

  // Reports — خروجی اکسل (mock → دانلود نمی‌شود، فقط جلوگیری از خطا)
  if (path === '/reports/invoices-export' && method === 'get') {
    return { _skipUnwrap: true, _blob: true, _message: 'خروجی اکسل در حالت Mock در دسترس نیست. لطفاً به بک‌اند واقعی متصل شوید.' };
  }
  if (path === '/reports/sample-excel' && method === 'get') {
    return { _skipUnwrap: true, _blob: true, _message: 'فایل نمونه در حالت Mock در دسترس نیست.' };
  }
  if (path === '/invoices/import' && method === 'post') {
    return { data: { success: true, message: 'تعداد ۳ فاکتور ثبت شد، ۱ خطا', data: { successCount: 3, errorCount: 1, errors: [{ row: 4, message: 'مشتری «09129999999» یافت نشد' }] } } };
  }

  // Users
  if (path === '/users' && method === 'get') return { data: { items: MOCK_USERS, pagination: { total: MOCK_USERS.length, page: 1, pageSize: 20 } } };
  if (path.startsWith('/users/u') && method === 'get') {
    const userId = path.split('/')[2];
    return { data: MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0] };
  }
  if (path.startsWith('/users/') && path.includes('/status')) return { data: { success: true } };

  return null;
}
