const asBigInt = (value) => {
  try { return BigInt(value || 0); } catch { return 0n; }
};

const clampBigInt = (value, min, max) => value < min ? min : value > max ? max : value;

function calculateShippingBenefit(input = {}) {
  const transportCost = asBigInt(input.transportCost);
  const purchaseAmount = asBigInt(input.purchaseAmount);
  const requestedBenefit = input.requestedBenefitAmount == null ? null : asBigInt(input.requestedBenefitAmount);
  const configuredPointValue = asBigInt(input.pointValueRial || 5000);
  const pointValueRial = configuredPointValue > 0n ? configuredPointValue : 5000n;
  const maxAutoApprovalBenefit = asBigInt(input.maxAutoApprovalBenefit || 10000000);
  const freeShippingMinPurchase = asBigInt(input.freeShippingMinPurchase || 1000000000);
  const tierCode = String(input.tierCode || '').toUpperCase();
  const freeShippingTiers = input.freeShippingTiers || ['GOLD', 'SPECIAL', 'EXCELLENT', 'DIAMOND'];
  const availablePoints = Math.max(0, Number(input.availablePoints) || 0);
  const requestedPoints = Math.max(0, Number(input.pointsRequested) || 0);

  let benefitType = null;
  let benefitAmount = 0n;
  let pointsUsed = 0;

  if (transportCost > 0n && freeShippingTiers.includes(tierCode) && purchaseAmount >= freeShippingMinPurchase) {
    benefitType = 'GOLD_FREE';
    benefitAmount = transportCost;
  } else if (transportCost > 0n && requestedPoints > 0 && availablePoints > 0) {
    pointsUsed = Math.min(requestedPoints, availablePoints, Number(transportCost / pointValueRial));
    benefitAmount = clampBigInt(BigInt(pointsUsed) * pointValueRial, 0n, transportCost);
    benefitType = benefitAmount > 0n ? 'POINTS' : null;
  } else if (requestedBenefit != null && requestedBenefit > 0n) {
    benefitAmount = clampBigInt(requestedBenefit, 0n, transportCost);
    benefitType = input.benefitType || 'DISCOUNT';
  }

  return {
    benefitType,
    benefitAmount,
    pointsUsed,
    customerPayable: transportCost - benefitAmount,
    requiresApproval: benefitAmount > maxAutoApprovalBenefit,
  };
}

function calculateTargetProgress(target, achieved) {
  const goal = Number(target) || 0;
  const actual = Number(achieved) || 0;
  return goal > 0 ? Math.round(actual / goal * 1000) / 10 : 0;
}

module.exports = { calculateShippingBenefit, calculateTargetProgress };
