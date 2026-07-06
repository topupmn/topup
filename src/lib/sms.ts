import { prisma } from "./prisma";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    return null;
  }

  return { accountSid, authToken, from, messagingServiceSid };
}

async function sendSms(to: string, body: string) {
  const config = getTwilioConfig();

  if (!config) {
    console.warn("SMS not configured. Message was not sent:", { to, body });
    throw new Error("SMS provider is not configured");
  }

  const params = new URLSearchParams({
    To: to,
    Body: body,
  });

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.from) {
    params.set("From", config.from);
  }

  const credentials = Buffer.from(
    `${config.accountSid}:${config.authToken}`
  ).toString("base64");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SMS send failed (${response.status}): ${error}`);
  }
}

export function buildGuestOrderUrl(orderId: string, token: string) {
  const url = new URL(`/orders/${orderId}`, getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildGuestOrderPath(orderId: string, token: string) {
  return `/orders/${orderId}?token=${encodeURIComponent(token)}`;
}

export async function sendGiftCardSms(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      fulfillment: true,
    },
  });

  if (!order?.phone || !order.fulfillment?.cardCode) {
    return;
  }

  const productName = order.items[0]?.product.name ?? "Gift card";
  const pinText = order.fulfillment.cardPin
    ? ` PIN: ${order.fulfillment.cardPin}`
    : "";

  try {
    await sendSms(
      order.phone,
      `topup.mn ${productName} code: ${order.fulfillment.cardCode}${pinText}. Order: ${order.orderNumber}`
    );

    await prisma.order.update({
      where: { id: orderId },
      data: {
        smsStatus: "SENT",
        smsSentAt: new Date(),
        smsErrorMessage: null,
      },
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        smsStatus: "FAILED",
        smsErrorMessage:
          error instanceof Error ? error.message : "Unknown SMS error",
      },
    });
    throw error;
  }
}
