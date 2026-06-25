"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatRatePerUsd } from "@/lib/pricing";
import { formatMnt } from "@/lib/utils";

interface PricingSettingsFormProps {
  mntUsdRate: number;
  markupPercent: number;
}

export function PricingSettingsForm({
  mntUsdRate,
  markupPercent,
}: PricingSettingsFormProps) {
  const router = useRouter();
  const [rate, setRate] = useState(String(mntUsdRate));
  const [markup, setMarkup] = useState(String(markupPercent));
  const [applyToProducts, setApplyToProducts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRate = Number(rate);
  const previewMarkup = Number(markup);
  const previewValid =
    Number.isFinite(previewRate) &&
    previewRate >= 1000 &&
    Number.isFinite(previewMarkup) &&
    previewMarkup >= 0;

  const previewPrice =
    previewValid && previewRate > 0
      ? Math.ceil(
          (10 * previewRate * (1 + previewMarkup / 100)) / 500
        ) * 500
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mntUsdRate: Number(rate),
        markupPercent: Number(markup),
        applyToProducts,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    setMessage(
      applyToProducts
        ? `Хадгалагдлаа. ${data.productsUpdated} бүтээгдэхүүний үнэ шинэчлэгдлээ.`
        : "Хадгалагдлаа. Бүтээгдэхүүний үнийг гараар sync хийнэ үү."
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-white p-5"
    >
      <h3 className="font-medium">Тохиргоо засах</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Ханш, нэмэгдлийг эндээс өөрчилнө. Өөрчлөлт өгөгдлийн санд хадгалагдана.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">USD ханш (₮ / 1 USD)</span>
          <input
            type="number"
            min={1000}
            max={20000}
            step={1}
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 min-h-11"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Нэмэгдэл (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            required
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 min-h-11"
          />
        </label>
      </div>

      {previewValid && previewPrice != null && (
        <p className="mt-4 text-sm text-muted-foreground">
          Урьдчилсан: $10 →{" "}
          <span className="font-medium text-foreground">
            {formatMnt(previewPrice)}
          </span>{" "}
          (ханш {formatRatePerUsd(previewRate * (1 + previewMarkup / 100))} / USD)
        </p>
      )}

      <label className="mt-4 flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={applyToProducts}
          onChange={(e) => setApplyToProducts(e.target.checked)}
          className="mt-1"
        />
        <span>
          Бүх бүтээгдэхүүний MNT үнийг шууд шинэчлэх
          <span className="block text-muted-foreground text-xs mt-0.5">
            Сонгоогүй бол зөвхөн тохиргоо хадгалагдана; дараа нь sync хийнэ
          </span>
        </span>
      </label>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm text-success" role="status">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 min-h-11"
      >
        {loading ? "Хадгалж байна..." : "Хадгалах"}
      </button>
    </form>
  );
}
