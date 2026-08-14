const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateShippingBenefit, calculateTargetProgress } = require('../src/services/businessService');

test('سطح طلایی با حداقل خرید، کل کرایه را پوشش می‌دهد', () => {
  const result = calculateShippingBenefit({ transportCost: 8_000_000, purchaseAmount: 1_200_000_000, tierCode: 'GOLD' });
  assert.equal(result.benefitType, 'GOLD_FREE');
  assert.equal(result.benefitAmount, 8_000_000n);
  assert.equal(result.customerPayable, 0n);
});

test('مصرف امتیاز از موجودی و مبلغ کرایه بیشتر نمی‌شود', () => {
  const result = calculateShippingBenefit({ transportCost: 2_000_000, pointsRequested: 900, availablePoints: 700, pointValueRial: 5000 });
  assert.equal(result.pointsUsed, 400);
  assert.equal(result.benefitAmount, 2_000_000n);
  assert.equal(result.customerPayable, 0n);
});

test('تخفیف دستی حمل به سقف کرایه محدود و برای مبلغ بالا نیازمند تأیید است', () => {
  const result = calculateShippingBenefit({ transportCost: 16_000_000, requestedBenefitAmount: 25_000_000, maxAutoApprovalBenefit: 10_000_000 });
  assert.equal(result.benefitAmount, 16_000_000n);
  assert.equal(result.requiresApproval, true);
});

test('درصد تحقق هدف با یک رقم اعشار محاسبه می‌شود', () => {
  assert.equal(calculateTargetProgress(120, 85), 70.8);
  assert.equal(calculateTargetProgress(0, 85), 0);
});
