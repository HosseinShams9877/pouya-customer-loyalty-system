/**
 * CEO Dashboard Service — آمار تجمیعی برای مدیرعامل
 * 
 * ۴ KPI اصلی:
 *   ۱. فروش کل (ماه جاری vs ماه قبل)
 *   ۲. سهم فروش نقدی
 *   ۳. تعداد پروژه‌های جدید
 *   ۴. میانگین رضایت مشتری CSAT
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * محاسبه تاریخ شروع/پایان ماه میلادی
 */
function getMonthRange(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * دریافت تمام داده‌های داشبورد مدیرعامل
 */
async function getDashboardData() {
  const now = new Date();
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  // ─── موازی تمام کوئری‌ها ───
  const [
    thisMonthInvoices,
    lastMonthInvoices,
    thisMonthCashInvoices,
    newLeadsThisMonth,
    csatStats,
    // نمودار خطی: فروش ۶ ماه اخیر
    sixMonthSales,
    // نمودار دایره‌ای: دلایل باخت
    lostReasons,
    overdueReceivables,
    reactivatedCustomers,
  ] = await Promise.all([
    // ۱. فروش ماه جاری
    prisma.invoice.aggregate({
      where: { createdAt: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum: { amount: true },
      _count: true,
    }),
    // فروش ماه قبل
    prisma.invoice.aggregate({
      where: { createdAt: { gte: lastMonth.start, lte: lastMonth.end } },
      _sum: { amount: true },
    }),
    // فروش نقدی ماه جاری
    prisma.invoice.aggregate({
      where: { createdAt: { gte: thisMonth.start, lte: thisMonth.end }, paymentType: 'CASH' },
      _sum: { amount: true },
    }),
    // سرنخ‌های جدید ماه جاری
    prisma.lead.count({
      where: { createdAt: { gte: thisMonth.start, lte: thisMonth.end } },
    }),
    // آمار CSAT
    prisma.csatToken.aggregate({
      where: { status: 'SUBMITTED', score: { not: null } },
      _avg: { score: true },
      _count: true,
    }),
    // ─── نمودار خطی: ۶ ماه ───
    Promise.all(
      [5, 4, 3, 2, 1, 0].map(async (monthsAgo) => {
        const range = getMonthRange(monthsAgo);
        const agg = await prisma.invoice.aggregate({
          where: { createdAt: { gte: range.start, lte: range.end } },
          _sum: { amount: true },
        });
        const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
        return {
          month: monthDate.toLocaleDateString('fa-IR', { month: 'long' }),
          monthShort: monthDate.toLocaleDateString('fa-IR', { month: 'short' }),
          total: agg._sum.amount || 0,
        };
      })
    ),
    // ─── دلایل باخت ───
    prisma.lead.groupBy({
      by: ['lostReason'],
      where: { stage: 'LOST', lostReason: { not: null } },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({ where: { paymentStatus: 'OVERDUE' }, _sum: { amount: true }, _count: true }),
    prisma.customer.count({ where: { reactivatedAt: { gte: thisMonth.start, lte: thisMonth.end } } }),
  ]);

  // ─── محاسبه KPIها ───
  const thisMonthTotal = thisMonthInvoices._sum.amount || 0;
  const lastMonthTotal = lastMonthInvoices._sum.amount || 0;
  const salesGrowth = lastMonthTotal > 0
    ? Math.round((Number(thisMonthTotal - lastMonthTotal) / Number(lastMonthTotal)) * 100)
    : 0;

  const thisMonthCash = thisMonthCashInvoices._sum.amount || 0;
  const cashPercentage = thisMonthTotal > 0
    ? Math.round((Number(thisMonthCash) / Number(thisMonthTotal)) * 100)
    : 0;

  const avgCsat = csatStats._avg.score
    ? Math.round(csatStats._avg.score * 10) / 10
    : null;

  return {
    kpis: {
      sales: {
        total: thisMonthTotal,
        invoiceCount: thisMonthInvoices._count,
        growth: salesGrowth,
        lastMonthTotal,
      },
      cashShare: {
        amount: thisMonthCash,
        percentage: cashPercentage,
      },
      newLeads: {
        count: newLeadsThisMonth,
      },
      csat: {
        average: avgCsat,
        totalResponses: csatStats._count,
      },
      receivables: { overdueAmount: overdueReceivables._sum.amount || 0n, overdueInvoices: overdueReceivables._count },
      reactivation: { count: reactivatedCustomers },
    },
    charts: {
      salesTrend: sixMonthSales,
      lostReasons: lostReasons.map((r) => ({
        reason: r.lostReason,
        count: r._count.id,
      })),
    },
  };
}

module.exports = { getDashboardData };
