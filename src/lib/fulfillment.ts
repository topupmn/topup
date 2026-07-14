import { prisma } from "./prisma";
import { placeReloadlyOrder, getReloadlyRedeemCode } from "./reloadly";
import { sendGiftCardSms } from "./sms";

const STALE_FULFILLING_MS = 2 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown fulfillment error";
}

function buildReloadlyCustomIdentifier(order: {
  orderNumber: string;
  fulfillment?: { errorMessage: string | null; reloadlyTransactionId: string | null } | null;
}) {
  if (!order.fulfillment?.errorMessage || order.fulfillment.reloadlyTransactionId) {
    return order.orderNumber;
  }

  return `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
}

async function markFulfillmentFailed(orderId: string, errorMessage: string) {
  await prisma.$transaction(async (tx) => {
    await tx.fulfillment.upsert({
      where: { orderId },
      create: {
        orderId,
        status: "FAILED",
        errorMessage,
      },
      update: {
        status: "FAILED",
        errorMessage,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: "FULFILLMENT_FAILED" },
    });
  });
}

export async function fulfillOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      payment: true,
      fulfillment: true,
    },
  });

  if (!order || order.payment?.status !== "PAID") {
    return;
  }

  if (order.fulfillment?.status === "SUCCESS") {
    if (order.status !== "DELIVERED") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
    }
    return;
  }

  const staleFulfillment =
    order.status === "FULFILLING" &&
    Date.now() - order.updatedAt.getTime() > STALE_FULFILLING_MS;

  if (
    order.status === "FULFILLING" &&
    !order.fulfillment?.reloadlyTransactionId &&
    !staleFulfillment
  ) {
    return;
  }

  const item = order.items[0];
  if (!item) {
    await markFulfillmentFailed(orderId, "Order has no items to fulfill");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "FULFILLING" },
    });

    await tx.fulfillment.upsert({
      where: { orderId },
      create: {
        orderId,
        status: "PENDING",
        errorMessage: null,
      },
      update: {
        status: "PENDING",
        errorMessage: null,
      },
    });
  });

  try {
    let reloadlyTransactionId = order.fulfillment?.reloadlyTransactionId ?? null;

    if (!reloadlyTransactionId) {
      const reloadlyOrder = await placeReloadlyOrder({
        productId: item.product.reloadlyId,
        countryCode: item.product.countryCode,
        quantity: 1,
        unitPrice: item.product.denominationUsd,
        customIdentifier: buildReloadlyCustomIdentifier(order),
        senderName: "topup.mn",
        recipientEmail:
          order.email ??
          process.env.RELOADLY_RECIPIENT_EMAIL ??
          "orders@topup.mn",
      });

      reloadlyTransactionId = String(reloadlyOrder.transactionId);

      await prisma.fulfillment.update({
        where: { orderId },
        data: {
          reloadlyTransactionId,
          status: "PENDING",
          errorMessage: null,
        },
      });
    }

    const redeemCode = await getReloadlyRedeemCode(Number(reloadlyTransactionId));

    await prisma.$transaction(async (tx) => {
      await tx.fulfillment.update({
        where: { orderId },
        data: {
          reloadlyTransactionId,
          cardCode: redeemCode.cardNumber,
          cardPin: redeemCode.pinCode,
          status: "SUCCESS",
          errorMessage: null,
          deliveredAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
    });

    try {
      await sendGiftCardSms(orderId);
    } catch (smsError) {
      console.error("SMS delivery error:", smsError);
    }
  } catch (error) {
    console.error("Fulfillment error:", error);
    await markFulfillmentFailed(orderId, getErrorMessage(error));
  }
}
