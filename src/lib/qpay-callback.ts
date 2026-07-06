import { prisma } from "./prisma";
import { checkQPayPayment, validateQPayPaymentComplete } from "./qpay";
import { fulfillOrder } from "./fulfillment";

export type QPayCallbackResult =
  | { status: "paid" | "already_processed" }
  | {
      status: "not_paid";
      reason: ReturnType<typeof validateQPayPaymentComplete>["reason"];
      paidAmountMnt: number;
    }
  | { status: "not_found" };

export async function processQPayPaymentReference(
  reference: string
): Promise<QPayCallbackResult> {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { qpayInvoiceId: reference },
        { order: { orderNumber: reference } },
      ],
    },
    include: { order: true },
  });

  if (!payment?.qpayInvoiceId) {
    return { status: "not_found" };
  }

  if (payment.status === "PAID") {
    if (
      payment.order.status === "PAID" ||
      payment.order.status === "FULFILLING"
    ) {
      await fulfillOrder(payment.orderId);
    }
    return { status: "already_processed" };
  }

  const checkResult = await checkQPayPayment(payment.qpayInvoiceId);
  const paymentValidation = validateQPayPaymentComplete(
    checkResult,
    payment.amountMnt
  );

  if (!paymentValidation.isComplete) {
    return {
      status: "not_paid",
      reason: paymentValidation.reason,
      paidAmountMnt: paymentValidation.paidAmountMnt,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    });

    await tx.fulfillment.upsert({
      where: { orderId: payment.orderId },
      create: { orderId: payment.orderId, status: "PENDING" },
      update: {
        status: "PENDING",
        errorMessage: null,
      },
    });
  });

  await fulfillOrder(payment.orderId);

  return { status: "paid" };
}
