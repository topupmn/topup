import { prisma } from "./prisma";
import type { PricingConfig } from "./pricing";
import {
  DEFAULT_MARKUP_PERCENT,
  DEFAULT_MNT_USD_RATE,
  MNT_ROUND_TO,
} from "./pricing";

const SETTINGS_ID = "default";

function envFallbackRate(): number {
  const rate = Number(process.env.MNT_USD_RATE ?? DEFAULT_MNT_USD_RATE);
  return Number.isFinite(rate) ? Math.round(rate) : DEFAULT_MNT_USD_RATE;
}

function envFallbackMarkup(): number {
  const markup = Number(
    process.env.PRICE_MARKUP_PERCENT ?? DEFAULT_MARKUP_PERCENT
  );
  return Number.isFinite(markup) ? markup : DEFAULT_MARKUP_PERCENT;
}

export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.siteSettings.create({
    data: {
      id: SETTINGS_ID,
      mntUsdRate: envFallbackRate(),
      markupPercent: envFallbackMarkup(),
    },
  });
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const settings = await getSiteSettings();
  return {
    mntUsdRate: settings.mntUsdRate,
    markupPercent: settings.markupPercent,
    roundToMnt: MNT_ROUND_TO,
  };
}

export async function updatePricingSettings(data: {
  mntUsdRate: number;
  markupPercent: number;
}) {
  return prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      mntUsdRate: data.mntUsdRate,
      markupPercent: data.markupPercent,
    },
    update: {
      mntUsdRate: data.mntUsdRate,
      markupPercent: data.markupPercent,
    },
  });
}
