import { getReloadlyAccountBalance } from "./reloadly";

export interface ReloadlyBalanceAvailability {
  balanceUsd: number | null;
  currencyCode: string | null;
  available: boolean;
  reason: "available" | "insufficient_balance" | "balance_unavailable";
}

type ProductUnavailableReason =
  | "insufficient_balance"
  | "balance_unavailable";

function toUsdCents(amount: number) {
  return Math.round(amount * 100);
}

export async function getReloadlyBalanceAvailability(
  denominationUsd: number
): Promise<ReloadlyBalanceAvailability> {
  try {
    const balance = await getReloadlyAccountBalance();

    if (balance.currencyCode !== "USD") {
      return {
        balanceUsd: null,
        currencyCode: balance.currencyCode,
        available: false,
        reason: "balance_unavailable",
      };
    }

    const availableBalance = Math.max(
      0,
      balance.balance - (balance.frozenBalance ?? 0)
    );
    const available = toUsdCents(availableBalance) >= toUsdCents(denominationUsd);

    return {
      balanceUsd: availableBalance,
      currencyCode: balance.currencyCode,
      available,
      reason: available ? "available" : "insufficient_balance",
    };
  } catch {
    return {
      balanceUsd: null,
      currencyCode: null,
      available: false,
      reason: "balance_unavailable",
    };
  }
}

export async function applyReloadlyBalanceAvailability<
  T extends { denominationUsd: number },
>(products: T[]) {
  const firstAvailability = await getReloadlyBalanceAvailability(0);

  return products.map((product) => {
    const available =
      firstAvailability.reason === "available" &&
      firstAvailability.balanceUsd !== null &&
      toUsdCents(firstAvailability.balanceUsd) >=
        toUsdCents(product.denominationUsd);
    const unavailableReason: ProductUnavailableReason | null = available
      ? null
      : firstAvailability.balanceUsd !== null
        ? "insufficient_balance"
        : "balance_unavailable";

    return {
      ...product,
      canPurchase: available,
      unavailableReason,
      reloadlyBalanceUsd: firstAvailability.balanceUsd,
    };
  });
}
