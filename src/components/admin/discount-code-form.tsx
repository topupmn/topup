"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiscountCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountPercent: Number(discountPercent),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Алдаа гарлаа");
      return;
    }

    setCode("");
    setDiscountPercent("");
    setMessage("Хөнгөлөлтийн код үүслээ");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-white p-5"
    >
      <h3 className="font-medium">Шинэ код үүсгэх</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <label className="block text-sm">
          <span className="font-medium">Код</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="SUMMER10"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 uppercase min-h-11"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Хөнгөлөлт (%)</span>
          <input
            type="number"
            min={1}
            max={99}
            step={0.5}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 min-h-11"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 min-h-11"
        >
          {loading ? "Үүсгэж байна..." : "Үүсгэх"}
        </button>
      </div>
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
    </form>
  );
}

