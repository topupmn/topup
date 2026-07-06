import { prisma } from "./prisma";

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function calculateDiscountMnt(
  amountMnt: number,
  discountPercent: number
): number {
  return Math.floor((amountMnt * discountPercent) / 100);
}

export async function getActiveDiscount(code: string) {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;

  return prisma.discountCode.findFirst({
    where: {
      code: normalized,
      isActive: true,
    },
  });
}

