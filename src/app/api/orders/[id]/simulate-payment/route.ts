import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";

function isTestPaymentAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TEST_PAYMENT === "true"
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTestPaymentAllowed()) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: { payment: true },
    });

    if (!order) {
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

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
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
