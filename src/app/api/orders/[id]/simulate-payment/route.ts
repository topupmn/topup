import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";
import { verifyGuestAccessToken } from "@/lib/guest-token";
import { forbidCrossSiteRequest } from "@/lib/request-security";

function isTestPaymentAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TEST_PAYMENT === "true"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  if (!isTestPaymentAllowed()) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("token");

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (
      !order ||
      (order.userId
        ? order.userId !== session?.user?.id
        : !verifyGuestAccessToken(token ?? "", order.guestAccessTokenHash))
    ) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Зөвхөн хүлээгдэж буй захиалгыг төлөх боломжтой" },
        { status: 400 }
      );
    }

    if (!order.payment) {
      return NextResponse.json({ error: "Төлбөр олдсонгүй" }, { status: 400 });
    }

    const paymentId = order.payment.id;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "PAID", paidAt: new Date() },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      await tx.fulfillment.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, status: "PENDING" },
        update: { status: "PENDING", errorMessage: null },
      });
    });

    await fulfillOrder(order.id);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });

    return NextResponse.json({
      success: true,
      status: updated?.status ?? "PAID",
      message: "Sandbox: төлбөр амжилттай тэмдэглэгдлээ",
    });
  } catch (error) {
    console.error("Simulate payment error:", error);
    return NextResponse.json(
      { error: "Төлбөр тэмдэглэхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
