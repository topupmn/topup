import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculatePriceMnt } from "@/lib/pricing";
import { getPricingConfig, updatePricingSettings } from "@/lib/site-settings";
import { forbidCrossSiteRequest } from "@/lib/request-security";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await getPricingConfig();
  return NextResponse.json(config);
}

export async function PATCH(request: Request) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const mntUsdRate = Number(body.mntUsdRate);
  const markupPercent = Number(body.markupPercent);
  const applyToProducts = body.applyToProducts !== false;

  if (
    !Number.isFinite(mntUsdRate) ||
    mntUsdRate < 1000 ||
    mntUsdRate > 20000
  ) {
    return NextResponse.json(
      { error: "Ханш 1,000–20,000 MNT хооронд байх ёстой" },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(markupPercent) ||
    markupPercent < 0 ||
    markupPercent > 100
  ) {
    return NextResponse.json(
      { error: "Нэмэгдэл 0–100% хооронд байх ёстой" },
      { status: 400 }
    );
  }

  await updatePricingSettings({
    mntUsdRate: Math.round(mntUsdRate),
    markupPercent,
  });

  const config = await getPricingConfig();
  let productsUpdated = 0;

  if (applyToProducts) {
    const products = await prisma.product.findMany();
    await Promise.all(
      products.map((product) => {
        const priceMnt = calculatePriceMnt(product.denominationUsd, config);
        productsUpdated += 1;
        return prisma.product.update({
          where: { id: product.id },
          data: { priceMnt },
        });
      })
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pricing");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/products", "layout");

  return NextResponse.json({
    ...config,
    productsUpdated,
  });
}
