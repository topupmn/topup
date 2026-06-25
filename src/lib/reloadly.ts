const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";

function getReloadlyAudience() {
  const env = process.env.RELOADLY_ENV ?? "sandbox";
  return env === "live"
    ? "https://giftcards.reloadly.com"
    : "https://giftcards-sandbox.reloadly.com";
}

function getReloadlyBaseUrl() {
  const env = process.env.RELOADLY_ENV ?? "sandbox";
  return env === "live"
    ? "https://giftcards.reloadly.com"
    : "https://giftcards-sandbox.reloadly.com";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getReloadlyToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.RELOADLY_CLIENT_ID;
  const clientSecret = process.env.RELOADLY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Reloadly credentials are not configured");
  }

  const response = await fetch(RELOADLY_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      audience: getReloadlyAudience(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Reloadly auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export interface ReloadlyProduct {
  productId: number;
  productName: string;
  brand: { brandName: string };
  country: { isoName: string };
  denominationType: "FIXED" | "RANGE";
  recipientCurrencyCode: string;
  minRecipientDenomination: number | null;
  maxRecipientDenomination: number | null;
  fixedRecipientDenominations: number[] | null;
  logoUrls: string[];
}

export function getProductDenominations(product: ReloadlyProduct): number[] {
  if (product.fixedRecipientDenominations?.length) {
    return product.fixedRecipientDenominations;
  }

  if (
    product.denominationType === "RANGE" &&
    product.minRecipientDenomination != null &&
    product.maxRecipientDenomination != null
  ) {
    const presets = [5, 10, 15, 20, 25, 50, 100];
    return presets.filter(
      (amount) =>
        amount >= product.minRecipientDenomination! &&
        amount <= product.maxRecipientDenomination!
    );
  }

  return [];
}

export async function listReloadlyProducts(
  countryCode = "US"
): Promise<ReloadlyProduct[]> {
  const token = await getReloadlyToken();
  const response = await fetch(
    `${getReloadlyBaseUrl()}/products?countryCode=${countryCode}&size=200`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list products: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content ?? [];
}

export interface ReloadlyOrderRequest {
  productId: number;
  countryCode: string;
  quantity: number;
  unitPrice: number;
  customIdentifier: string;
  senderName: string;
  recipientEmail: string;
}

export interface ReloadlyOrderResponse {
  transactionId: number;
  status: string;
}

export async function placeReloadlyOrder(
  order: ReloadlyOrderRequest
): Promise<ReloadlyOrderResponse> {
  const token = await getReloadlyToken();
  const response = await fetch(`${getReloadlyBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reloadly order failed: ${error}`);
  }

  return response.json();
}

export interface ReloadlyRedeemCode {
  cardNumber: string;
  pinCode: string | null;
}

export async function getReloadlyRedeemCode(
  transactionId: number
): Promise<ReloadlyRedeemCode> {
  const token = await getReloadlyToken();
  const response = await fetch(
    `${getReloadlyBaseUrl()}/orders/transactions/${transactionId}/cards`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get redeem code: ${response.statusText}`);
  }

  const data = await response.json();
  const card = data[0];
  return {
    cardNumber: card.cardNumber,
    pinCode: card.pinCode ?? null,
  };
}
