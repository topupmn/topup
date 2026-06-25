import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkQPayPayment, isQPayPaymentComplete } from "@/lib/qpay";
import { fulfillOrder } from "@/lib/fulfillment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = body.invoice_id ?? body.object_id;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { qpayInvoiceId: invoiceId },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ status: "already_processed" });
    }

    const checkResult = await checkQPayPayment(invoiceId);

    if (!isQPayPaymentComplete(checkResult)) {
      return NextResponse.json({ status: "not_paid" });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    });

    await fulfillOrder(payment.orderId);

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("QPay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
