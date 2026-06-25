"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryFulfillmentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRetry() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Алдаа гарлаа");
        return;
      }
      setMessage("Амжилттай дахин оролдлоо");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Оролдож байна..." : "Код дахин авах"}
      </button>
      {message && (
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      )}
    </div>
  );
}
