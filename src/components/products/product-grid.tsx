"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMnt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  formatPhoneDigitsInput,
  getMongolianPhoneError,
  MN_PHONE_DIGIT_LENGTH,
} from "@/lib/phone";

interface Product {
  id: string;
  name: string;
  nameMn: string | null;
  brand: string;
  denominationUsd: number;
  priceMnt: number;
  imageUrl: string | null;
  canPurchase?: boolean;
  unavailableReason?: "insufficient_balance" | "balance_unavailable" | null;
  reloadlyBalanceUsd?: number | null;
}

export function ProductGrid({ products }: { products: Product[] }) {
  const router = useRouter();
  const [discountCodes, setDiscountCodes] = useState<Record<string, string>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({});
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  async function handleBuy(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (product?.canPurchase === false) {
      return;
    }

    if (selectedProductId !== productId) {
      setSelectedProductId(productId);
      return;
    }

    const phone = phoneNumbers[productId] ?? "";
    const phoneError = getMongolianPhoneError(phone);
    if (phoneError) {
      setPhoneErrors((errors) => ({ ...errors, [productId]: phoneError }));
      return;
    }

    setPhoneErrors((errors) => ({ ...errors, [productId]: "" }));

    try {
      setLoadingProductId(productId);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          phone: phoneNumbers[productId],
          discountCode: discountCodes[productId]?.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Алдаа гарлаа");
        return;
      }

      router.push(data.orderUrl ?? `/orders/${data.orderId}`);
    } finally {
      setLoadingProductId(null);
    }
  }

  return (
    <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const canPurchase = product.canPurchase !== false;
        const unavailableText =
          product.unavailableReason === "insufficient_balance"
            ? "Үлдэгдэл хүрэлцэхгүй"
            : "Түр боломжгүй";

        return (
          <div
            key={product.id}
            className="rounded-2xl border border-border bg-white p-4 sm:p-6 flex flex-col shadow-sm"
          >
            {product.imageUrl && (
              <div className="relative aspect-[4/3] mb-4 rounded-lg bg-muted overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            )}
            <h3 className="font-semibold text-base sm:text-lg">{product.name}</h3>
            <p className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4 text-primary">
              {formatMnt(product.priceMnt)}
            </p>
            {selectedProductId === product.id && (
              <>
                <label className="mt-4 block text-sm">
                  <span className="font-medium">
                    Утасны дугаар <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={phoneNumbers[product.id] ?? ""}
                    onChange={(e) => {
                      const digits = formatPhoneDigitsInput(e.target.value);
                      setPhoneNumbers((phones) => ({
                        ...phones,
                        [product.id]: digits,
                      }));
                      if (phoneErrors[product.id]) {
                        setPhoneErrors((errors) => ({
                          ...errors,
                          [product.id]: "",
                        }));
                      }
                    }}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="99112233"
                    maxLength={MN_PHONE_DIGIT_LENGTH}
                    pattern={`[0-9]{${MN_PHONE_DIGIT_LENGTH}}`}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 min-h-11 ${
                      phoneErrors[product.id]
                        ? "border-red-300 focus:ring-red-200"
                        : "border-border"
                    }`}
                    required
                  />
                  {phoneErrors[product.id] && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {phoneErrors[product.id]}
                    </p>
                  )}
                </label>
                <label className="mt-4 block text-sm">
                  <span className="font-medium">Хөнгөлөлтийн код</span>
                  <input
                    value={discountCodes[product.id] ?? ""}
                    onChange={(e) =>
                      setDiscountCodes((codes) => ({
                        ...codes,
                        [product.id]: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Код байвал оруулна уу"
                    className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 uppercase min-h-11"
                  />
                </label>
              </>
            )}
            <Button
              onClick={() => handleBuy(product.id)}
              disabled={loadingProductId === product.id || !canPurchase}
              className="mt-4 w-full"
            >
              {!canPurchase
                ? unavailableText
                : loadingProductId === product.id
                  ? "Бэлтгэж байна..."
                  : selectedProductId === product.id
                    ? "Худалдан авах"
                    : "Сонгох >"}
            </Button>
            {!canPurchase &&
              product.unavailableReason === "insufficient_balance" && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Reloadly үлдэгдэл бага байна
                </p>
              )}
          </div>
        );
      })}
    </div>
  );
}
