import { prisma } from "./prisma";
import { placeReloadlyOrder, getReloadlyRedeemCode } from "./reloadly";

export async function fulfillOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      payment: true,
      fulfillment: true,
    },
  });

  if (!order || order.fulfillment?.status === "SUCCESS") {
    return;
  }

  if (order.status !== "PAID" && order.status !== "FAILED") {
    return;
  }

  if (order.fulfillment?.status === "FAILED") {
    await prisma.fulfillment.delete({ where: { orderId } });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "FULFILLING" },
  });

  const item = order.items[0];
  if (!item) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    });
    return;
  }

  try {
    const reloadlyOrder = await placeReloadlyOrder({
      productId: item.product.reloadlyId,
      countryCode: item.product.countryCode,
      quantity: 1,
      unitPrice: item.product.denominationUsd,
      customIdentifier: order.orderNumber,
      senderName: "topup.mn",
      recipientEmail: order.email,
    });

    const redeemCode = await getReloadlyRedeemCode(reloadlyOrder.transactionId);

    await prisma.fulfillment.create({
      data: {
        orderId: order.id,
        reloadlyTransactionId: String(reloadlyOrder.transactionId),
        cardCode: redeemCode.cardNumber,
        cardPin: redeemCode.pinCode,
        status: "SUCCESS",
        deliveredAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });
  } catch (error) {
    console.error("Fulfillment error:", error);
    await prisma.fulfillment.create({
      data: {
        orderId: order.id,
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Unknown fulfillment error",
      },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    });
  }
}
