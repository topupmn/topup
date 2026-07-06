import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseQPayBankUrls } from "@/lib/qpay";
import { processQPayPaymentReference } from "@/lib/qpay-callback";
import { fulfillOrder } from "@/lib/fulfillment";
import { verifyGuestAccessToken } from "@/lib/guest-token";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const token = new URL(request.url).searchParams.get("token");

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        payment: true,
        fulfillment: true,
      },
    });

    if (
      !order ||
      (order.userId
        ? order.userId !== session?.user?.id
        : !verifyGuestAccessToken(token ?? "", order.guestAccessTokenHash))
    ) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    if (
      order.status === "PENDING_PAYMENT" &&
      order.payment?.qpayInvoiceId
    ) {
      const paymentResult = await processQPayPaymentReference(
        order.payment.qpayInvoiceId
      );

      if (
        paymentResult.status === "paid" ||
        paymentResult.status === "already_processed"
      ) {
        const refreshed = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            items: { include: { product: true } },
            payment: true,
            fulfillment: true,
          },
        });
        if (refreshed) {
          Object.assign(order, refreshed);
        }
      }
    }

    if (order.status === "PAID" && order.payment?.status === "PAID") {
      await fulfillOrder(order.id);
      const refreshed = await prisma.order.findFirst({
        where: { id: order.id },
        include: {
          items: { include: { product: true } },
          payment: true,
          fulfillment: true,
        },
      });
      if (refreshed) {
        Object.assign(order, refreshed);
      }
    }

    const subtotalMnt =
      order.subtotalMnt > 0 ? order.subtotalMnt : order.totalMnt + order.discountMnt;

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotalMnt,
      discountMnt: order.discountMnt,
      discountCode: order.discountCode,
      discountPercent: order.discountPercent,
      totalMnt: order.totalMnt,
      product: order.items[0]?.product ?? null,
      payment: order.payment
        ? {
            status: order.payment.status,
            qrText: order.payment.qpayQrText,
            qrImage: order.payment.qpayQrImage,
            bankUrls: parseQPayBankUrls(order.payment.qpayBankUrls),
          }
        : null,
      fulfillment: order.fulfillment
        ? {
            status: order.fulfillment.status,
            cardCode:
              order.status === "DELIVERED"
                ? order.fulfillment.cardCode
                : null,
            cardPin:
              order.status === "DELIVERED"
                ? order.fulfillment.cardPin
                : null,
          }
        : null,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Захиалга авахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
