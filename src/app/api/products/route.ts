import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyReloadlyBalanceAvailability } from "@/lib/reloadly-balance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(brand ? { brand: { equals: brand, mode: "insensitive" } } : {}),
      },
      orderBy: { priceMnt: "asc" },
    });

    return NextResponse.json(await applyReloadlyBalanceAvailability(products));
  } catch {
    return NextResponse.json(
      { error: "Бүтээгдэхүүн авахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
