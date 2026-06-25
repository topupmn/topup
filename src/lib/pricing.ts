export const DEFAULT_MNT_USD_RATE = 3500;
export const DEFAULT_MARKUP_PERCENT = 5;
export const MNT_ROUND_TO = 500;

export interface PricingConfig {
  mntUsdRate: number;
  markupPercent: number;
  roundToMnt: number;
}

export interface PriceBreakdown {
  denominationUsd: number;
  baseMnt: number;
  markupMntBeforeRound: number;
  rawMnt: number;
  priceMnt: number;
  roundingMnt: number;
  effectiveRatePerUsd: number;
  markupPercent: number;
}

export function calculatePriceMnt(
  usdAmount: number,
  config: PricingConfig
): number {
  const raw =
    usdAmount * config.mntUsdRate * (1 + config.markupPercent / 100);
  return Math.ceil(raw / config.roundToMnt) * config.roundToMnt;
}

export function getPriceBreakdown(
  denominationUsd: number,
  config: PricingConfig
): PriceBreakdown {
  const baseMnt = denominationUsd * config.mntUsdRate;
  const rawMnt =
    denominationUsd * config.mntUsdRate * (1 + config.markupPercent / 100);
  const priceMnt = Math.ceil(rawMnt / config.roundToMnt) * config.roundToMnt;
  const markupMntBeforeRound = rawMnt - baseMnt;
  const roundingMnt = priceMnt - rawMnt;

  return {
    denominationUsd,
    baseMnt,
    markupMntBeforeRound,
    rawMnt,
    priceMnt,
    roundingMnt,
    effectiveRatePerUsd: priceMnt / denominationUsd,
    markupPercent: config.markupPercent,
  };
}

export function formatRatePerUsd(rate: number): string {
  return `₮${Math.round(rate).toLocaleString("mn-MN")}`;
}
