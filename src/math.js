// Pure trove math for MUSD (a Liquity-style CDP). Amounts are plain JS numbers.
// mcr/ccr are ratios (1.1 = 110%). Values are read live from TroveManager when available.

export function collateralRatio(collBtc, debtMusd, btcPrice) {
  if (!(debtMusd > 0)) return Infinity;
  return (collBtc * btcPrice) / debtMusd;
}

// BTC price at which a trove hits the minimum collateral ratio and can be liquidated.
export function liquidationPrice(collBtc, debtMusd, mcr = 1.1) {
  if (!(collBtc > 0)) return Infinity;
  return (debtMusd * mcr) / collBtc;
}

// Largest total debt the collateral supports at a target ratio.
export function maxDebt(collBtc, btcPrice, targetRatio) {
  if (!(targetRatio > 0)) throw new Error('targetRatio must be > 0');
  return (collBtc * btcPrice) / targetRatio;
}

// Total debt recorded on opening: requested amount + borrowing fee + gas compensation reserve.
export function openingDebt(borrowMusd, { borrowingRate = 0.001, gasCompensation = 200 } = {}) {
  return borrowMusd * (1 + borrowingRate) + gasCompensation;
}

export function healthLabel(ratio, { mcr = 1.1, ccr = 1.5 } = {}) {
  if (!Number.isFinite(ratio)) return 'no debt';
  if (ratio < mcr) return 'liquidatable';
  if (ratio < ccr) return 'at risk';
  if (ratio < 2) return 'moderate';
  return 'healthy';
}

// How far BTC can fall (as a fraction) before liquidation.
export function drawdownToLiquidation(collBtc, debtMusd, btcPrice, mcr = 1.1) {
  const lp = liquidationPrice(collBtc, debtMusd, mcr);
  if (!Number.isFinite(lp)) return 1;
  return Math.max(0, 1 - lp / btcPrice);
}
