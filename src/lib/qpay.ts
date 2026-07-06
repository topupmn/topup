import { Prisma } from "@prisma/client";

interface QPayConfig {
  baseUrl: string;
  username: string;
  password: string;
  invoiceCode: string;
  callbackUrl: string;
}

function getQPayConfig(): QPayConfig {
  const baseUrl = process.env.QPAY_BASE_URL;
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  const invoiceCode = process.env.QPAY_INVOICE_CODE;
  const callbackUrl = process.env.QPAY_CALLBACK_URL;

  if (!baseUrl || !username || !password || !invoiceCode || !callbackUrl) {
    throw new Error("QPay credentials are not configured");
  }

  return { baseUrl, username, password, invoiceCode, callbackUrl };
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getQPayAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const { baseUrl, username, password } = getQPayConfig();
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QPay auth failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedAccessToken.token;
}

export interface QPayInvoiceRequest {
  senderInvoiceNo: string;
  amount: number;
  description: string;
}

export interface QPayBankUrl {
  name: string;
  link: string;
  description?: string;
  logo?: string;
}

export interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl?: string;
  urls: QPayBankUrl[];
}

function buildQPayCallbackUrl(callbackUrl: string, senderInvoiceNo: string): string {
  const url = new URL(callbackUrl);
  url.searchParams.set("sender_invoice_no", senderInvoiceNo);
  return url.toString();
}

export function parseQPayBankUrls(value: Prisma.JsonValue | null): QPayBankUrl[] {
  if (!value || !Array.isArray(value)) return [];

  const urls: QPayBankUrl[] = [];
  for (const item of value) {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "link" in item &&
      typeof item.name === "string" &&
      typeof item.link === "string"
    ) {
      urls.push({
        name: item.name,
        link: item.link,
        description:
          "description" in item && typeof item.description === "string"
            ? item.description
            : undefined,
        logo:
          "logo" in item && typeof item.logo === "string"
            ? item.logo
            : undefined,
      });
    }
  }
  return urls;
}

export async function createQPayInvoice(
  request: QPayInvoiceRequest
): Promise<QPayInvoiceResponse> {
  const { baseUrl, invoiceCode, callbackUrl } = getQPayConfig();
  const token = await getQPayAccessToken();

  const response = await fetch(`${baseUrl}/v2/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: request.senderInvoiceNo,
      invoice_receiver_code: "terminal",
      invoice_description: request.description,
      amount: request.amount,
      callback_url: buildQPayCallbackUrl(callbackUrl, request.senderInvoiceNo),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QPay invoice creation failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    ...data,
    urls: data.urls ?? [],
  };
}

export interface QPayPaymentCheckResponse {
  count: number;
  paid_amount?: number | string;
  rows: {
    payment_id: string;
    payment_status: string;
    payment_amount: number | string;
    trx_fee?: number | string;
    payment_currency?: string;
    payment_wallet?: string;
    payment_type?: string;
    payment_date?: string;
  }[];
}

export interface QPayPaymentValidation {
  isComplete: boolean;
  reason:
    | "not_paid"
    | "missing_paid_amount"
    | "amount_mismatch"
    | "missing_paid_row"
    | "paid";
  paidAmountMnt: number;
}

export async function checkQPayPayment(
  invoiceId: string
): Promise<QPayPaymentCheckResponse> {
  const { baseUrl } = getQPayConfig();
  const token = await getQPayAccessToken();

  const response = await fetch(`${baseUrl}/v2/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QPay payment check failed (${response.status}): ${error}`);
  }

  return response.json();
}

function parseMntToMinorUnits(value: number | string | undefined): number | null {
  if (value == null) return null;

  const text =
    typeof value === "number" ? value.toFixed(2) : value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function validateQPayPaymentComplete(
  result: QPayPaymentCheckResponse,
  expectedAmountMnt: number
): QPayPaymentValidation {
  const expectedMinor = expectedAmountMnt * 100;

  if (result.count <= 0 || result.rows.length === 0) {
    return { isComplete: false, reason: "not_paid", paidAmountMnt: 0 };
  }

  const paidAmountMinor = parseMntToMinorUnits(result.paid_amount);
  if (paidAmountMinor == null) {
    return { isComplete: false, reason: "missing_paid_amount", paidAmountMnt: 0 };
  }

  const paidAmountMnt = paidAmountMinor / 100;
  if (paidAmountMinor !== expectedMinor) {
    return { isComplete: false, reason: "amount_mismatch", paidAmountMnt };
  }

  const hasPaidRow = result.rows.some((row) => {
    const rowAmountMinor = parseMntToMinorUnits(row.payment_amount);
    const currencyMatches = !row.payment_currency || row.payment_currency === "MNT";

    return (
      row.payment_status === "PAID" &&
      currencyMatches &&
      rowAmountMinor === expectedMinor
    );
  });

  if (!hasPaidRow) {
    return { isComplete: false, reason: "missing_paid_row", paidAmountMnt };
  }

  return { isComplete: true, reason: "paid", paidAmountMnt };
}
