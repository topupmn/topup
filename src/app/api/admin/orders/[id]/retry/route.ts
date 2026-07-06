import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";
import { forbidCrossSiteRequest } from "@/lib/request-security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true, fulfillment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
  }

  if (order.payment?.status !== "PAID") {
    return NextResponse.json(
      { error: "Төлбөр төлөгдөөгүй захиалга" },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id },
    data: { status: "PAID" },
  });

  await fulfillOrder(id);

  return NextResponse.json({ success: true });
}
