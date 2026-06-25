export function formatMnt(amount: number): string {
  return `₮${amount.toLocaleString("mn-MN")}`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TU-${datePart}-${random}`;
}

export const ORDER_EXPIRY_MINUTES = 30;

export function getOrderExpiryDate(): Date {
  return new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);
}
