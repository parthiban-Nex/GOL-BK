function toNumber(val) {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function roundAmount(val) {
  if (val === null || val === undefined) return null;
  return Number(toNumber(val).toFixed(2));
}

function normalize(val) {
  return val ? String(val).trim().toUpperCase() : '';
}

function isCompareMatch(selectedPart, comparePart) {
  if (!selectedPart || !comparePart) return false;

  // 1. Primary match: components
  const selComp = normalize(selectedPart.components);
  const compComp = normalize(comparePart.components);
  if (selComp && compComp && selComp === compComp) return true;

  // 2. Fallback match: subAggregate
  const selSub = normalize(selectedPart.subAggregate);
  const compSub = normalize(comparePart.subAggregate);
  if (selSub && compSub && selSub === compSub) return true;

  return false;
}

export function prepareCartResponse(cartObject = {}) {
  const selected = Array.isArray(cartObject.selected) ? cartObject.selected : [];
  const compare = Array.isArray(cartObject.compare) ? cartObject.compare : [];
  const parts = Array.isArray(cartObject.parts) ? cartObject.parts : [];
  const hasCompareData = compare.length > 0;

  let totalAmount = 0;
  let totalTaxableAmount = 0;
  let totalTax = 0;
  let grandTotal = 0;
  let totalPointsEarned = 0;
  let totalQuantity = 0;
  let totalDiscountAmount = 0;
  let totalSavings = hasCompareData ? 0 : null;

  const updatedSelected = selected.map((part) => {
    const quantity = toNumber(part.quantity) > 0 ? toNumber(part.quantity) : 1;
    const mrp = toNumber(part.mrp);
    const saleRate = toNumber(part.saleRate || part.listPrice || mrp);
    const listPrice = toNumber(part.listPrice || mrp);
    const taxPercent = toNumber(part.taxpercent || 18);

    // Loyalty points (check bronzePoints/silverPoints/goldPoints/platinumPoints first for LubesProducts)
    const loyaltyBasePoints = toNumber(
      part.bronzePoints ||
      part.silverPoints ||
      part.goldPoints ||
      part.platinumPoints ||
      part.points ||
      (part.partConfig ? part.partConfig.loyaltyBasePoints : 0)
    );
    const pointsEarned = loyaltyBasePoints * quantity;

    // Inclusive GST Tax Calculation
    let billingPrice = saleRate;
    let tax = 0;
    if (taxPercent > 0) {
      billingPrice = saleRate / (1 + taxPercent / 100);
      tax = saleRate - billingPrice;
    }

    // Line totals
    const mrpAmount = mrp * quantity;
    const taxableAmount = billingPrice * quantity;
    const taxAmount = tax * quantity;
    const lineTotal = saleRate * quantity;

    // Discount calculation
    let discountPerUnit = mrp - saleRate;
    if (discountPerUnit < 0) discountPerUnit = 0;
    const discountAmount = discountPerUnit * quantity;

    // Savings calculation against compare items
    let matchedCompare = null;
    let compareSaleRate = null;
    let savingPerUnit = null;
    let savingAmount = null;

    if (hasCompareData) {
      matchedCompare = compare.find((compItem) => isCompareMatch(part, compItem));

      if (matchedCompare) {
        compareSaleRate = toNumber(matchedCompare.saleRate);
        const savingDiff = compareSaleRate - saleRate;
        savingPerUnit = savingDiff > 0 ? savingDiff : 0;
        savingAmount = savingPerUnit * quantity;
        totalSavings += savingAmount;
      } else {
        savingPerUnit = 0;
        savingAmount = 0;
      }
    }

    // Cart aggregate additions
    totalAmount += mrpAmount;
    totalTaxableAmount += taxableAmount;
    totalTax += taxAmount;
    grandTotal += lineTotal;
    totalPointsEarned += pointsEarned;
    totalQuantity += quantity;
    totalDiscountAmount += discountAmount;

    return {
      customerCode: part.customerCode || '0046',
      quantity,
      brandName: part.brandName || part.product_brand || '',
      itemDescription: part.itemDescription || part.part_desc || '',
      partNumber: part.partNumber || part.part_number || '',
      mrp,
      saleRate,
      listPrice,
      taxpercent: taxPercent,
      aggregate: part.aggregate || '',
      subAggregate: part.subAggregate || '',
      partConfig: part.partConfig || {
        discountPercent: 4,
        loyaltyBasePoints: 0,
        loyaltyBands: [
          { max: 75000, min: 50000, points: 0 },
          { max: 100000, min: 75000, points: 0 },
          { max: null, min: 100000, points: 0 },
        ],
      },
      loyaltyBasePoints: roundAmount(loyaltyBasePoints),
      pointsEarned: roundAmount(pointsEarned),
      billingPrice: roundAmount(billingPrice),
      tax: roundAmount(tax),
      total: roundAmount(saleRate),
      mrpAmount: roundAmount(mrpAmount),
      taxableAmount: roundAmount(taxableAmount),
      taxAmount: roundAmount(taxAmount),
      totalAmount: roundAmount(lineTotal),
      discountPerUnit: roundAmount(discountPerUnit),
      discountAmount: roundAmount(discountAmount),
      compareMatched: hasCompareData ? !!matchedCompare : null,
      compareSaleRate: compareSaleRate !== null ? roundAmount(compareSaleRate) : null,
      savingPerUnit: savingPerUnit !== null ? roundAmount(savingPerUnit) : null,
      savingAmount: savingAmount !== null ? roundAmount(savingAmount) : null,
      ...part,
    };
  });

  return {
    selected: updatedSelected,
    compare: compare,
    parts: parts,
    summary: {
      totalItems: updatedSelected.length,
      totalQuantity: roundAmount(totalQuantity),
      totalAmount: roundAmount(totalAmount),
      totalTaxableAmount: roundAmount(totalTaxableAmount),
      totalTax: roundAmount(totalTax),
      grandTotal: roundAmount(totalTaxableAmount + totalTax),
      totalPointsEarned: roundAmount(totalPointsEarned),
      totalDiscountAmount: roundAmount(totalDiscountAmount),
      totalSavings: (totalSavings !== null && totalSavings > 0) ? roundAmount(totalSavings) : roundAmount(totalDiscountAmount),
    },
  };
}

export default { prepareCartResponse };
