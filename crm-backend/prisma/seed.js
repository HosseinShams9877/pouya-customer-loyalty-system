require('dotenv').config();
const prisma = require('../src/lib/prisma');
const { hashPassword } = require('../src/services/authService');

const daysAgo = (days) => new Date(Date.now() - days * 86400000);

async function main() {
  // ============================================
  // 1. تعریف سطوح وفاداری (Loyalty Tiers)
  // ============================================
  const tierDefinitions = [
    { code: 'BASE', title: 'پایه پیمانکار', audienceType: 'CONTRACTOR', color: '#64748B', minPoints: 0, multiplier: 1, sortOrder: 1, benefits: JSON.stringify(['امتیاز خرید', 'دسترسی به پیشنهادهای عمومی']) },
    { code: 'SILVER', title: 'نقره‌ای', audienceType: 'CONTRACTOR', color: '#94A3B8', minPoints: 1500, multiplier: 1.1, sortOrder: 2, benefits: JSON.stringify(['۱۰٪ امتیاز بیشتر', 'تخفیف حمل دوره‌ای', 'پشتیبانی سریع‌تر']) },
    { code: 'GOLD', title: 'طلایی', audienceType: 'CONTRACTOR', color: '#D97706', minPoints: 3500, multiplier: 1.25, sortOrder: 3, benefits: JSON.stringify(['۲۵٪ امتیاز بیشتر', 'اعتبار خرید اختصاصی', 'تحویل اولویت‌دار']) },
    { code: 'SPECIAL', title: 'ویژه', audienceType: 'CONTRACTOR', color: '#7C3AED', minPoints: 7000, multiplier: 1.5, sortOrder: 4, benefits: JSON.stringify(['۵۰٪ امتیاز بیشتر', 'مدیر حساب اختصاصی', 'شرایط اعتباری ویژه', 'اولویت تخصیص موجودی']) },
    { code: 'REP_C', title: 'نماینده C', audienceType: 'REPRESENTATIVE', color: '#64748B', minPoints: 0, multiplier: 1, sortOrder: 1, benefits: JSON.stringify(['تخفیف پایه نمایندگی', 'ثبت پروژه در پورتال']) },
    { code: 'REP_B', title: 'نماینده B', audienceType: 'REPRESENTATIVE', color: '#0EA5E9', minPoints: 2500, multiplier: 1.15, sortOrder: 2, benefits: JSON.stringify(['تخفیف پلکانی', 'اولویت مشاوره فروش']) },
    { code: 'REP_A', title: 'نماینده A', audienceType: 'REPRESENTATIVE', color: '#D97706', minPoints: 6000, multiplier: 1.3, sortOrder: 3, benefits: JSON.stringify(['سهمیه فروش ویژه', 'حمایت بازاریابی منطقه‌ای']) },
    { code: 'REP_EXCELLENT', title: 'نماینده ممتاز', audienceType: 'REPRESENTATIVE', color: '#7C3AED', minPoints: 12000, multiplier: 1.6, sortOrder: 4, benefits: JSON.stringify(['بیشترین ضریب امتیاز', 'مدیر حساب اختصاصی', 'اولویت تخصیص موجودی']) },
  ];
  
  const tiers = {};
  for (const tier of tierDefinitions) {
    tiers[tier.code] = await prisma.loyaltyTier.upsert({ 
      where: { code: tier.code }, 
      update: tier, 
      create: tier 
    });
  }
  console.log('✅ Tiers created');

  // ============================================
  // 2. تنظیمات سیستم (Settings)
  // ============================================
  const settings = [
    ['purchaseRialPerPoint', '1000000', 'ریال خرید به ازای هر امتیاز', 'loyalty'],
    ['cashBonusPoints', '50', 'امتیاز اضافه خرید نقدی', 'loyalty'],
    ['financialBonusPoints', '20', 'امتیاز اضافه پرداخت بدون تاخیر', 'loyalty'],
    ['walletConversionThreshold', '1000', 'حداقل امتیاز برای تبدیل به ریال', 'loyalty'],
    ['walletRialPerConversion', '500000', 'ریال به ازای هر تبدیل کیف پول', 'loyalty'],
    ['pointExpiryDays', '365', 'مدت اعتبار امتیاز', 'loyalty'],
    ['referralRewardPoints', '250', 'پاداش معرفی موفق', 'loyalty'],
    ['projectReferralPoints', '300', 'پاداش ثبت پروژه تأییدشده توسط نماینده', 'loyalty'],
    ['churnInRiskMultiplier', '1.5', 'ضریب هشدار ریزش نسبت به فاصله معمول خرید', 'retention'],
    ['churnConfirmedMultiplier', '2.5', 'ضریب تشخیص ریزش قطعی', 'retention'],
    ['churnInactiveDays', '90', 'حد غیرفعالی مشتری تک‌خرید', 'retention'],
    ['reactivationWindowSize', '250', 'ظرفیت پنجره فعال‌سازی مجدد', 'retention'],
    ['memberOtpExpiryMinutes', '3', 'اعتبار رمز یک‌بارمصرف عضو', 'member'],
  ];
  for (const [key, value, label, group] of settings) {
    await prisma.setting.upsert({ 
      where: { key }, 
      update: { value, label, group }, 
      create: { key, value, label, group } 
    });
  }
  console.log('✅ Settings created');

  // ============================================
  // 3. کاربر ادمین
  // ============================================
  const password = process.env.SEED_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : 'Admin@123456');
  if (password) {
    await prisma.user.upsert({
      where: { email: 'admin@loyalty.com' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: { 
        firstName: 'علی', 
        lastName: 'محمدی', 
        email: 'admin@loyalty.com', 
        mobile: '09120000001', 
        password: await hashPassword(password), 
        role: 'ADMIN' 
      },
    });
    console.log('✅ Admin user created');
  }

  // ============================================
  // 4. قوانین وفاداری (Loyalty Rules)
  // ============================================
  const rules = [
    { 
      code: 'HIGH_VALUE', 
      title: 'بونوس خرید عمده', 
      description: 'پاداش فاکتورهای بالای یک میلیارد ریال', 
      eventType: 'PURCHASE', 
      conditions: JSON.stringify({ minAmount: '1000000000' }), 
      action: JSON.stringify({ type: 'POINTS_FIXED', value: 200 }), 
      priority: 20, 
      stackable: true 
    },
    { 
      code: 'GOLD_CASHBACK', 
      title: 'کش‌بک اعضای طلایی', 
      description: 'نیم درصد کش‌بک برای پرداخت نقدی سطح طلایی و ویژه', 
      eventType: 'INVOICE_PAID', 
      conditions: JSON.stringify({ paymentType: 'CASH', tierCodes: ['GOLD', 'SPECIAL'] }), 
      action: JSON.stringify({ type: 'CASHBACK_PERCENT', value: 0.5, cap: '10000000' }), 
      priority: 30, 
      stackable: true 
    },
    { 
      code: 'PROJECT_REFERRAL', 
      title: 'پاداش معرفی پروژه', 
      description: 'امتیاز پس از تأیید پروژه ثبت‌شده توسط نماینده', 
      eventType: 'PROJECT_REFERRAL', 
      conditions: JSON.stringify({}), 
      action: JSON.stringify({ type: 'POINTS_FIXED', value: 300 }), 
      priority: 10, 
      stackable: true 
    },
  ];
  for (const rule of rules) {
    await prisma.loyaltyRule.upsert({ 
      where: { code: rule.code }, 
      update: rule, 
      create: rule 
    });
  }
  console.log('✅ Loyalty rules created');

  // ============================================
  // 5. جوایز (Rewards)
  // ============================================
  const rewardDefinitions = [
    { code: 'SHIP-50', title: '۵۰٪ تخفیف حمل', description: 'تخفیف هزینه حمل سفارش بعدی تا سقف تعیین‌شده', type: 'SHIPPING', costPoints: 600, cashValue: 2500000n, stock: null, imageIcon: 'truck', fulfillmentMode: 'COUPON', isFeatured: true },
    { code: 'CREDIT-5M', title: '۵ میلیون ریال اعتبار خرید', description: 'شارژ مستقیم کیف پول برای سفارش بعدی', type: 'CREDIT', costPoints: 1000, cashValue: 5000000n, stock: null, imageIcon: 'wallet', fulfillmentMode: 'WALLET', isFeatured: true },
    { code: 'SAMPLE-KIT', title: 'پک نمونه محصولات', description: 'پک نمونه فنی محصولات منتخب برای پروژه', type: 'GIFT', costPoints: 450, cashValue: null, stock: 24, imageIcon: 'package', fulfillmentMode: 'MANUAL', isFeatured: false },
    { code: 'TECH-CONSULT', title: 'جلسه مشاوره فنی پروژه', description: 'یک جلسه تخصصی محاسبه و انتخاب محصول', type: 'SERVICE', costPoints: 800, cashValue: null, stock: null, imageIcon: 'headphones', fulfillmentMode: 'MANUAL', isFeatured: true },
    { code: 'PRIORITY-DELIVERY', title: 'تحویل اولویت‌دار', description: 'قرارگیری یک سفارش در صف تحویل اولویت‌دار', type: 'SERVICE', costPoints: 1400, cashValue: null, stock: 10, imageIcon: 'zap', eligibleTierId: tiers.GOLD.id, fulfillmentMode: 'MANUAL', isFeatured: false },
    { code: 'CREDIT-20M', title: '۲۰ میلیون ریال اعتبار ویژه', description: 'پاداش اختصاصی اعضای سطح ویژه', type: 'CREDIT', costPoints: 3500, cashValue: 20000000n, stock: 8, imageIcon: 'gem', eligibleTierId: tiers.SPECIAL.id, fulfillmentMode: 'WALLET', isFeatured: true },
  ];
  for (const reward of rewardDefinitions) {
    await prisma.reward.upsert({ 
      where: { code: reward.code }, 
      update: reward, 
      create: reward 
    });
  }
  console.log('✅ Rewards created');

  // ============================================
  // 6. ماموریت‌ها (Missions)
  // ============================================
  const missions = [
    { code: 'THREE-PURCHASES', title: 'سه خرید پیاپی', description: 'در دوره جاری سه فاکتور خرید ثبت کنید.', actionType: 'PURCHASE_COUNT', targetValue: 3, rewardPoints: 180, badge: 'repeat' },
    { code: 'BILLION-CLUB', title: 'باشگاه یک‌میلیاردی', description: 'مجموع خرید مأموریت را به یک میلیارد ریال برسانید.', actionType: 'PURCHASE_AMOUNT', targetValue: 1000, rewardPoints: 300, badge: 'target' },
    { code: 'REFERRAL-ONE', title: 'همکار جدید معرفی کنید', description: 'یک مشتری سازمانی جدید و واجد شرایط معرفی کنید.', actionType: 'REFERRAL', targetValue: 1, rewardPoints: 250, badge: 'users' },
    { code: 'PROFILE-COMPLETE', title: 'پروفایل حرفه‌ای', description: 'اطلاعات شرکت و علایق خرید خود را کامل کنید.', actionType: 'PROFILE', targetValue: 1, rewardPoints: 80, badge: 'profile' },
  ];
  for (const mission of missions) {
    await prisma.mission.upsert({ 
      where: { code: mission.code }, 
      update: mission, 
      create: mission 
    });
  }
  console.log('✅ Missions created');

  // ============================================
  // 7. سگمنت‌ها (Segments)
  // ============================================
  const segments = [
    { code: 'VIP', title: 'ارزشمندترین اعضا', description: 'اعضای با بیش از ۳۵۰۰ امتیاز طول عمر', color: '#D97706', criteria: JSON.stringify({ minLifetimePoints: 3500 }) },
    { code: 'AT_RISK', title: 'در معرض ریزش', description: 'نیازمند پیشنهاد بازگشت', color: '#EF4444', criteria: JSON.stringify({ status: 'IN_RISK' }) },
    { code: 'NEW_MEMBERS', title: 'اعضای جدید', description: 'حداکثر یک خرید ثبت‌شده', color: '#0EA5E9', criteria: JSON.stringify({ maxInvoicesCount: 1 }) },
    { code: 'LOYAL_ACTIVE', title: 'وفادار فعال', description: 'حداقل پنج خرید و فعالیت اخیر', color: '#10B981', criteria: JSON.stringify({ minInvoicesCount: 5, maxDaysSinceLast: 30 }) },
  ];
  for (const segment of segments) {
    await prisma.loyaltySegment.upsert({ 
      where: { code: segment.code }, 
      update: segment, 
      create: segment 
    });
  }
  console.log('✅ Segments created');

  // ============================================
  // 8. مشتریان (Customers)
  // ============================================
  const memberDefinitions = [
    { mobile: '09121111111', fullName: 'رضا احمدی', company: 'ساختمان‌سازی آفتاب', city: 'تهران', province: 'تهران', customerType: 'CONTRACTOR', tierId: tiers.GOLD.id, membershipNo: 'PP-1404-1001', referralCode: 'REZA1001', status: 'ACTIVE', totalPurchase: 3200000000n, totalPoints: 3450, lifetimePoints: 4650, redeemedPoints: 1200, walletBalance: 5000000n, invoicesCount: 8, daysSinceLast: 12, avgDaysBetween: 18, lastActivityAt: daysAgo(12) },
    { mobile: '09122222222', fullName: 'محمد حسینی', company: 'پیمانکاران نوین', city: 'اصفهان', province: 'اصفهان', tierId: tiers.SILVER.id, membershipNo: 'PP-1404-1002', referralCode: 'MOHA1002', status: 'IN_RISK', totalPurchase: 1500000000n, totalPoints: 1680, lifetimePoints: 1880, redeemedPoints: 200, walletBalance: 0n, invoicesCount: 5, daysSinceLast: 38, avgDaysBetween: 22, lastActivityAt: daysAgo(38) },
    { mobile: '09123333333', fullName: 'حسن کریمی', company: 'گروه ساختمانی پارس', city: 'شیراز', province: 'فارس', customerType: 'CONTRACTOR', tierId: tiers.SPECIAL.id, membershipNo: 'PP-1404-1003', referralCode: 'HASA1003', status: 'ACTIVE', totalPurchase: 5600000000n, totalPoints: 5900, lifetimePoints: 8200, redeemedPoints: 2300, walletBalance: 15000000n, invoicesCount: 12, daysSinceLast: 8, avgDaysBetween: 15, lastActivityAt: daysAgo(8) },
    { mobile: '09124444444', fullName: 'سارا رضایی', company: 'آرام سازان', city: 'تهران', province: 'تهران', tierId: tiers.BASE.id, membershipNo: 'PP-1404-1004', referralCode: 'SARA1004', status: 'CHURNED', totalPurchase: 900000000n, totalPoints: 950, lifetimePoints: 950, redeemedPoints: 0, walletBalance: 0n, invoicesCount: 3, daysSinceLast: 65, avgDaysBetween: 25, lastActivityAt: daysAgo(65) },
    { mobile: '09125555555', fullName: 'امیر نوری', company: 'سازه گستر', city: 'کرج', province: 'البرز', tierId: tiers.SILVER.id, membershipNo: 'PP-1404-1005', referralCode: 'AMIR1005', status: 'ACTIVE', totalPurchase: 2100000000n, totalPoints: 2300, lifetimePoints: 2800, redeemedPoints: 500, walletBalance: 5000000n, invoicesCount: 6, daysSinceLast: 15, avgDaysBetween: 20, lastActivityAt: daysAgo(15) },
    { mobile: '09126666666', fullName: 'فاطمه عباسی', company: 'پارس دژ', city: 'تهران', province: 'تهران', tierId: tiers.BASE.id, membershipNo: 'PP-1404-1006', referralCode: 'FATI1006', status: 'NEW', totalPurchase: 0n, totalPoints: 120, lifetimePoints: 120, redeemedPoints: 0, walletBalance: 0n, invoicesCount: 0, daysSinceLast: null, avgDaysBetween: null, lastActivityAt: daysAgo(2) },
    { mobile: '09127777777', fullName: 'کیان شریفی', company: 'نمایندگی آسمان سازان', city: 'سیرجان', province: 'کرمان', customerType: 'REPRESENTATIVE', tierId: tiers.REP_A.id, membershipNo: 'PP-REP-1001', referralCode: 'KIYA1007', status: 'ACTIVE', totalPurchase: 7200000000n, totalPoints: 4800, lifetimePoints: 6800, redeemedPoints: 2000, walletBalance: 12000000n, invoicesCount: 18, daysSinceLast: 9, avgDaysBetween: 16, lastActivityAt: daysAgo(9) },
  ];
  
  const customers = {};
  for (const member of memberDefinitions) {
    customers[member.mobile] = await prisma.customer.upsert({ 
      where: { mobile: member.mobile }, 
      update: member, 
      create: member 
    });
  }
  console.log('✅ Customers created');

  // ============================================
  // 9. نماینده و پروژه (Representative & Project)
  // ============================================
  const demoRepresentative = await prisma.representativeAccount.upsert({
    where: { customerId: customers['09127777777'].id },
    update: { grade: 'A', discountRate: 7.5, region: 'کرمان و جنوب شرق', status: 'ACTIVE' },
    create: { customerId: customers['09127777777'].id, code: 'REP-KRM-001', grade: 'A', discountRate: 7.5, region: 'کرمان و جنوب شرق' },
  });
  
  const demoProject = await prisma.project.upsert({
    where: { id: 'demo-project-arman' },
    update: { title: 'مجتمع مسکونی آرمان', city: 'سیرجان', executor: 'احمد مرادی', status: 'SKELETON' },
    create: { id: 'demo-project-arman', title: 'مجتمع مسکونی آرمان', city: 'سیرجان', executor: 'احمد مرادی', status: 'SKELETON', budget: 780000000n },
  });
  
  const demoEndCustomer = await prisma.customer.upsert({
    where: { mobile: '09121212121' },
    update: { fullName: 'احمد مرادی', company: 'انبوه‌سازان آرمان', city: 'سیرجان', customerType: 'END_CUSTOMER' },
    create: { mobile: '09121212121', fullName: 'احمد مرادی', company: 'انبوه‌سازان آرمان', city: 'سیرجان', customerType: 'END_CUSTOMER', tierId: tiers.BASE.id, membershipNo: 'PP-END-1001', referralCode: 'ARMA1008' },
  });
  
  const existingRegistration = await prisma.representativeRegistration.findFirst({ 
    where: { representativeId: demoRepresentative.id, projectId: demoProject.id } 
  });
  if (!existingRegistration) {
    await prisma.representativeRegistration.create({ 
      data: { 
        representativeId: demoRepresentative.id, 
        endCustomerId: demoEndCustomer.id, 
        projectId: demoProject.id, 
        contractorName: 'احمد مرادی', 
        contractorMobile: '09121212121', 
        contractorCompany: 'انبوه‌سازان آرمان', 
        city: 'سیرجان', 
        estimatedVolume: 780000000n 
      } 
    });
  } else {
    await prisma.representativeRegistration.update({ 
      where: { id: existingRegistration.id }, 
      data: { endCustomerId: demoEndCustomer.id } 
    });
  }
  console.log('✅ Representative & Project created');

  // ============================================
  // 10. فاکتورها (Invoices)
  // ============================================
  const invoiceDefinitions = [
    { invoiceNumber: 'INV-1404-001', mobile: '09121111111', amount: 450000000n, paymentType: 'CASH', paymentStatus: 'PAID', points: 520, days: 5 },
    { invoiceNumber: 'INV-1404-002', mobile: '09122222222', amount: 780000000n, paymentType: 'CREDIT', paymentStatus: 'PAID', points: 800, days: 12 },
    { invoiceNumber: 'SPD-1404-101', mobile: '09123333333', amount: 1200000000n, paymentType: 'CASH', paymentStatus: 'PAID', points: 1587, days: 20 },
    { invoiceNumber: 'INV-1404-004', mobile: '09121111111', amount: 320000000n, paymentType: 'CREDIT', paymentStatus: 'PENDING', points: 320, days: 3 },
    { invoiceNumber: 'SPD-1404-102', mobile: '09125555555', amount: 600000000n, paymentType: 'CASH', paymentStatus: 'OVERDUE', points: 650, days: 30 },
  ];
  for (const invoice of invoiceDefinitions) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: invoice.invoiceNumber },
      update: {},
      create: { 
        invoiceNumber: invoice.invoiceNumber, 
        customerId: customers[invoice.mobile].id, 
        amount: invoice.amount, 
        paymentType: invoice.paymentType, 
        paymentStatus: invoice.paymentStatus, 
        source: invoice.invoiceNumber.startsWith('SPD') ? 'SEPIDAR_EXCEL' : 'MANUAL', 
        loyaltyPointsEarned: invoice.points, 
        loyaltyProcessedAt: daysAgo(invoice.days), 
        createdAt: daysAgo(invoice.days), 
        paymentDate: invoice.paymentStatus === 'PAID' ? daysAgo(invoice.days) : null 
      },
    });
  }
  console.log('✅ Invoices created');

  // ============================================
  // 11. تراکنش‌های امتیاز (Point Transactions)
  // ============================================
  for (const member of memberDefinitions) {
    const customer = customers[member.mobile];
    const existing = await prisma.pointTransaction.findFirst({ 
      where: { customerId: customer.id, sourceType: 'SEED' } 
    });
    if (!existing && member.totalPoints > 0) {
      await prisma.pointTransaction.create({ 
        data: { 
          customerId: customer.id, 
          type: 'EARN', 
          sourceType: 'SEED', 
          points: member.totalPoints, 
          remainingPoints: member.totalPoints, 
          balanceAfter: member.totalPoints, 
          description: 'انتقال مانده افتتاحیه باشگاه', 
          createdAt: daysAgo(45), 
          expiresAt: new Date(Date.now() + 320 * 86400000) 
        } 
      });
    }
  }
  console.log('✅ Point transactions created');

  // ============================================
  // 12. ماموریت مشتری (Customer Mission)
  // ============================================
  const threePurchases = await prisma.mission.findUnique({ where: { code: 'THREE-PURCHASES' } });
  await prisma.customerMission.upsert({ 
    where: { customerId_missionId: { customerId: customers['09121111111'].id, missionId: threePurchases.id } }, 
    update: { progress: 2 }, 
    create: { customerId: customers['09121111111'].id, missionId: threePurchases.id, progress: 2 } 
  });
  console.log('✅ Customer mission created');

  // ============================================
  // 13. محصولات (Products)
  // ============================================
  const productDefinitions = [
    { code: 'EPS-CEIL-10', title: 'یونولیت سقفی دانسیته ۱۰', category: 'CEILING_EPS', densityMin: 10, densityMax: 10, dimensions: JSON.stringify({ lengths: [100, 200], widths: [50], heights: [20, 25] }), basePrice: 1850000n, priceUnit: 'ریال / بلوک' },
    { code: 'EPS-WALL-12', title: 'یونولیت دیواری دانسیته ۱۲', category: 'WALL_EPS', densityMin: 12, densityMax: 12, dimensions: JSON.stringify({ lengths: [200], widths: [100], thicknesses: [3, 5, 10] }), basePrice: 2450000n, priceUnit: 'ریال / ورق' },
    { code: 'PANEL-3D', title: 'پنل سه‌بعدی ساختمانی', category: 'THREED_PANEL', densityMin: 10, densityMax: 15, dimensions: JSON.stringify({ widths: [120], heights: [300] }), basePrice: 9800000n, priceUnit: 'ریال / مترمربع' },
    { code: 'EPS-BOX', title: 'یخدان و بسته‌بندی یونولیتی', category: 'PACKAGING', densityMin: 15, densityMax: 20, dimensions: JSON.stringify({ custom: true }), basePrice: 3200000n, priceUnit: 'ریال / عدد' },
  ];
  
  const products = {};
  for (const product of productDefinitions) {
    products[product.code] = await prisma.productCatalog.upsert({ 
      where: { code: product.code }, 
      update: product, 
      create: product 
    });
  }
  console.log('✅ Products created');

  // ============================================
  // 14. قوانین قیمت (Price Rules)
  // ============================================
  const priceRules = [
    { code: 'CASH-3', title: 'تخفیف پرداخت نقدی', ruleType: 'CASH', audienceType: 'ALL', minAmount: 100000000n, discountPercent: 3, maxDiscountRial: 15000000n, approvalRequired: false },
    { code: 'VOLUME-5', title: 'تخفیف خرید حجمی', ruleType: 'VOLUME', audienceType: 'ALL', minAmount: 1000000000n, discountPercent: 5, maxDiscountRial: 60000000n, approvalRequired: true },
    { code: 'PROJECT-7', title: 'تخفیف پروژه تأییدشده', ruleType: 'PROJECT', audienceType: 'CONTRACTOR', minAmount: 700000000n, discountPercent: 7, maxDiscountRial: 75000000n, approvalRequired: true, conditions: JSON.stringify({ approvedProjectRequired: true }) },
    { code: 'REP-A-75', title: 'قیمت نماینده سطح A', ruleType: 'REPRESENTATIVE', audienceType: 'REPRESENTATIVE', minAmount: 0n, discountPercent: 7.5, approvalRequired: false, conditions: JSON.stringify({ grades: ['A', 'EXCELLENT'] }) },
    { code: 'GOLD-SHIP', title: 'حمل اعضای طلایی', ruleType: 'SHIPPING', audienceType: 'CONTRACTOR', minAmount: 800000000n, discountPercent: 100, maxDiscountRial: 12000000n, approvalRequired: true, conditions: JSON.stringify({ tiers: ['GOLD', 'SPECIAL'] }) },
  ];
  for (const rule of priceRules) {
    await prisma.priceRule.upsert({ 
      where: { code: rule.code }, 
      update: rule, 
      create: rule 
    });
  }
  console.log('✅ Price rules created');

  // ============================================
  // 15. هدف فروش (Sales Target)
  // ============================================
  const targetPeriod = '1405-05';
  const target = await prisma.salesTarget.findFirst({ 
    where: { period: targetPeriod, scopeType: 'COMPANY', scopeId: null } 
  });
  const targetData = { 
    period: targetPeriod, 
    scopeType: 'COMPANY', 
    scopeId: null, 
    scopeLabel: 'کل شرکت', 
    targetAmount: 6000000000n, 
    achievedAmount: 4250000000n, 
    targetCashShare: 70, 
    achievedCashShare: 60, 
    targetNewLeads: 25, 
    achievedNewLeads: 17, 
    targetProjects: 12, 
    achievedProjects: 8 
  };
  if (target) {
    await prisma.salesTarget.update({ where: { id: target.id }, data: targetData });
  } else {
    await prisma.salesTarget.create({ data: targetData });
  }
  console.log('✅ Sales target created');

  // ============================================
  // 16. درخواست خرید (Purchase Request)
  // ============================================
  const existingRequest = await prisma.purchaseRequest.findFirst({ 
    where: { customerId: customers['09121111111'].id, productId: products['EPS-CEIL-10'].id } 
  });
  if (!existingRequest) {
    await prisma.purchaseRequest.create({ 
      data: { 
        customerId: customers['09121111111'].id, 
        productId: products['EPS-CEIL-10'].id, 
        requestType: 'INQUIRY', 
        productTitle: 'یونولیت سقفی دانسیته ۱۰', 
        quantity: 220, 
        unit: 'بلوک', 
        projectName: 'برج آفتاب', 
        city: 'تهران', 
        description: 'درخواست قیمت و زمان ارسال', 
        status: 'NEW' 
      } 
    });
  }
  console.log('✅ Purchase request created');

  // ============================================
  // 17. حمل و نقل (Shipment)
  // ============================================
  await prisma.shipment.upsert({ 
    where: { trackingCode: 'SHIP-1405-081' }, 
    update: {}, 
    create: { 
      trackingCode: 'SHIP-1405-081', 
      customerId: customers['09123333333'].id, 
      invoiceNumber: 'SPD-1404-101', 
      destination: 'شیراز', 
      province: 'فارس', 
      transportCost: 18000000n, 
      benefitType: 'GOLD_FREE', 
      benefitAmount: 10000000n, 
      pointsUsed: 600, 
      status: 'SENT', 
      requiresApproval: false, 
      sentAt: daysAgo(1) 
    } 
  });
  console.log('✅ Shipment created');

  console.log('🎉 Seed V2.2 completed successfully!');
  console.log('📧 Admin: admin@loyalty.com');
  console.log('🔑 Password: Admin@123456');
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());