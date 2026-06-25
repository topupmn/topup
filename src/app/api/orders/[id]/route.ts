import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkQPayPayment, isQPayPaymentComplete, parseQPayBankUrls } from "@/lib/qpay";
import { fulfillOrder } from "@/lib/fulfillment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: { include: { product: true } },
        payment: true,
        fulfillment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    if (
      order.status === "PENDING_PAYMENT" &&
      order.payment?.qpayInvoiceId
    ) {
      const checkResult = await checkQPayPayment(order.payment.qpayInvoiceId);
      if (isQPayPaymentComplete(checkResult)) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });
        order.status = "PAID";
        order.payment.status = "PAID";
      }
    }

    if (order.status === "PAID" && !order.fulfillment) {
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

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
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
