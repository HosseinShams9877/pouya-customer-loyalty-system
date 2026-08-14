/**
 * سرویس تبادل داده با اکسل
 * جایگزین اتصال به سپیدار (بدون API)
 * 
 * خروجی: فاکتورها → اکسل برای حسابداری
 * ورود: اکسل → ثبت گروهی فاکتور + محاسبه امتیاز
 */

const ExcelJS = require('exceljs');
const prisma = require('../lib/prisma');
const loyaltyService = require('./loyaltyService');
const communicationService = require('./communicationService');

// ════════════════════════════════════════════
// ۱. خروجی اکسل (Export)
// ════════════════════════════════════════════

/**
 * تولید فایل اکسل از فاکتورها با فیلتر تاریخ
 * @returns {Buffer} - فایل اکسل باینری
 */
async function exportInvoicesToExcel({ fromDate, toDate } = {}) {
  // ساخت فیلتر تاریخ
  const where = {};
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  // خواندن فاکتورها با نام مشتری
  let invoices = [];
  try {
    invoices = await prisma.invoice.findMany({
      where,
      include: { customer: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // اگر دیتابیس در دسترس نبود → آرایه خالی
  }

  // ایجاد Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'باشگاه مشتریان پویا';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('فاکتورها', {
    properties: { defaultColWidth: 20 },
    views: [{ rightToLeft: true }],
  });

  // --- استایل‌های مشترک ---
  const headerFont = { name: 'B Nazanin', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } }; // Sky Blue
  const headerBorder = { style: 'thin', color: { argb: 'FF0369A1' } };
  const cellBorder = { style: 'thin', color: { argb: 'FFCBD5E1' } };

  // --- ردیف عنوان ---
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'گزارش فاکتورها — باشگاه مشتریان پویا پلاستیک';
  titleCell.font = { name: 'B Nazanin', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // --- ردیف فیلتر ---
  if (fromDate || toDate) {
    sheet.mergeCells('A2:F2');
    const filterCell = sheet.getCell('A2');
    const fromStr = fromDate ? new Date(fromDate).toLocaleDateString('fa-IR') : 'بدون محدودیت';
    const toStr = toDate ? new Date(toDate).toLocaleDateString('fa-IR') : 'بدون محدودیت';
    filterCell.value = `از: ${fromStr}  |  تا: ${toStr}`;
    filterCell.font = { name: 'B Nazanin', size: 10, color: { argb: 'FF64748B' } };
    filterCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 22;
  }

  // --- هدرها ---
  const headerRow = fromDate || toDate ? 3 : 2;
  const headers = ['ردیف', 'شماره فاکتور', 'نام مشتری', 'مبلغ (ریال)', 'نوع پرداخت', 'امتیاز کسب شده', 'تاریخ ثبت'];
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  headers.forEach((h, i) => {
    const cell = sheet.getCell(`${columns[i]}${headerRow}`);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = headerBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  sheet.getRow(headerRow).height = 28;

  // --- داده‌ها ---
  const paymentTypeMap = { CASH: 'نقدی', CREDIT: 'اعتباری' };

  invoices.forEach((inv, idx) => {
    const row = headerRow + 1 + idx;
    const loyalty = inv.loyaltyPointsEarned || 0;

    const values = [
      idx + 1,
      inv.invoiceNumber,
      inv.customer?.fullName || 'نامشخص',
      inv.amount,
      paymentTypeMap[inv.paymentType] || inv.paymentType,
      loyalty,
      inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('fa-IR') : '',
    ];

    values.forEach((v, i) => {
      const cell = sheet.getCell(`${columns[i]}${row}`);
      cell.value = v;
      cell.border = cellBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      // فرمت عدد برای مبلغ
      if (i === 3) cell.numFmt = '#,##0';
    });

    // زبرنگ‌سازی ردیف‌های زوج
    if (idx % 2 === 0) {
      columns.forEach(col => {
        sheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      });
    }
  });

  // --- ردیف جمع ---
  if (invoices.length > 0) {
    const totalRow = headerRow + 1 + invoices.length;
    sheet.mergeCells(`A${totalRow}:C${totalRow}`);
    const totalCell = sheet.getCell(`A${totalRow}`);
    totalCell.value = `مجموع (${invoices.length} فاکتور)`;
    totalCell.font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
    totalCell.alignment = { horizontal: 'center' };

    const amountCell = sheet.getCell(`D${totalRow}`);
    amountCell.value = { formula: `SUM(D${headerRow + 1}:D${headerRow + invoices.length})` };
    amountCell.font = { bold: true, size: 11, color: { argb: 'FF0EA5E9' } };
    amountCell.numFmt = '#,##0';
    amountCell.alignment = { horizontal: 'center' };
  }

  // تولید بفر
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ════════════════════════════════════════════
// ۲. ورود گروهی اکسل (Bulk Import)
// ════════════════════════════════════════════

/**
 * ستون‌های مورد انتظار فایل اکسل ورودی:
 * A: شماره فاکتور
 * B: نام مشتری (یا موبایل)
 * C: مبلغ (ریال)
 * D: نوع پرداخت (CASH / نقدی  یا  CREDIT / اعتباری)
 * E: وضعیت پرداخت (PAID / تسویه  یا  PENDING / در انتظار)
 *
 * مشتری از طریق موبایل یا نام پیدا می‌شود.
 */
async function importInvoicesFromExcel(fileBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('فایل اکسل خالی است یا شیت ندارد.');

  const results = { success: 0, errors: [], errorRows: [] };
  const MAX_ROWS = 500; // محدودیت امنیتی

  // خواندن تمام ردیف‌ها (از ردیف ۲ به بعد، ردیف ۱ هدر است)
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // ردیف هدر
    if (rowNumber > MAX_ROWS + 1) return; // محدودیت
    rows.push({ rowNumber, values: row.values });
  });

  for (const { rowNumber, values } of rows) {
    try {
      // values[0] خالی است (فرمت ExcelJS)
      const invoiceNumber = String(values[1] || '').trim();
      const customerIdentifier = String(values[2] || '').trim();
      const amount = Number(values[3]);
      const paymentTypeRaw = String(values[4] || '').trim().toUpperCase();
      const paymentStatusRaw = String(values[5] || '').trim().toUpperCase();

      // --- اعتبارسنجی ---
      if (!invoiceNumber) throw new Error('شماره فاکتور خالی است');
      if (!customerIdentifier) throw new Error('نام/موبایل مشتری خالی است');
      if (!amount || amount <= 0) throw new Error('مبلغ نامعتبر است');

      // نوع پرداخت
      const paymentType = (paymentTypeRaw === 'CASH' || paymentTypeRaw === 'نقدی') ? 'CASH' : 'CREDIT';

      // وضعیت پرداخت
      let paymentStatus = 'PENDING';
      if (paymentStatusRaw === 'PAID' || paymentStatusRaw === 'تسویه') paymentStatus = 'PAID';
      else if (paymentStatusRaw === 'OVERDUE' || paymentStatusRaw === 'سررسید') paymentStatus = 'OVERDUE';

      // پیدا کردن مشتری (از طریق موبایل یا نام)
      let customer;
      try {
        // ابتدا جستجو با موبایل
        if (/^09\d{9}$/.test(customerIdentifier)) {
          customer = await prisma.customer.findUnique({ where: { mobile: customerIdentifier } });
        }
        // اگر با موبایل پیدا نشد → جستجو با نام
        if (!customer) {
          customer = await prisma.customer.findFirst({ where: { fullName: customerIdentifier } });
        }
      } catch {
        // دیتابیس در دسترس نیست
      }

      if (!customer) throw new Error(`مشتری «${customerIdentifier}» یافت نشد`);

      // ثبت فاکتور
      try {
        const result = await prisma.$transaction(async (tx) => {
          const duplicate = await tx.invoice.findUnique({ where: { invoiceNumber } });
          if (duplicate) throw new Error('شماره فاکتور تکراری است');
          const currentCustomer = await tx.customer.findUnique({ where: { id: customer.id } });
          const invoice = await tx.invoice.create({
            data: { invoiceNumber, customerId: customer.id, amount: BigInt(Math.trunc(amount)), paymentType, paymentStatus, source: 'SEPIDAR_EXCEL', paymentDate: paymentStatus === 'PAID' ? new Date() : null },
          });
          const loyalty = await loyaltyService.processInvoice(tx, invoice, currentCustomer);
          return { invoice, loyalty };
        });

        await communicationService.sendInvoicePointsSms({ invoice: result.invoice, customer, points: result.loyalty.totalPoints, walletCredit: result.loyalty.walletCredit }).catch(() => null);

        results.success++;
      } catch (dbErr) {
        // ممکن است شماره فاکتور تکراری باشد
        throw new Error(`خطای ثبت: ${dbErr.message}`);
      }

    } catch (rowErr) {
      results.errors.push({ row: rowNumber, message: rowErr.message });
      results.errorRows.push(rowNumber);
    }
  }

  return results;
}

/**
 * تولید فایل نمونه اکسل برای دانلود کاربر
 */
async function generateSampleExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'باشگاه مشتریان پویا';

  const sheet = workbook.addWorksheet('نمونه ورود فاکتور', {
    views: [{ rightToLeft: true }],
  });

  const headers = ['شماره فاکتور', 'نام یا موبایل مشتری', 'مبلغ (ریال)', 'نوع پرداخت (CASH/CREDIT)', 'وضعیت (PAID/PENDING)'];
  const sampleData = [
    ['INV-1404-101', '09121111111', 450000000, 'CASH', 'PAID'],
    ['INV-1404-102', 'رضا احمدی', 780000000, 'CREDIT', 'PENDING'],
    ['INV-1404-103', '09123333333', 1200000000, 'CASH', 'PAID'],
  ];

  // هدر
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
  headers.forEach((h, i) => {
    const cell = sheet.getCell(i + 1, 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill;
  });

  // داده‌های نمونه
  sampleData.forEach((row, rowIdx) => {
    row.forEach((val, colIdx) => {
      const cell = sheet.getCell(colIdx + 1, rowIdx + 2);
      cell.value = val;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  exportInvoicesToExcel,
  importInvoicesFromExcel,
  generateSampleExcel,
};
