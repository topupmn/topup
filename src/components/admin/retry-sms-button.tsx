"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetrySmsButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRetry() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry-sms`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Алдаа гарлаа");
        return;
      }
      setMessage("SMS дахин илгээгдлээ");
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
        {loading ? "Илгээж байна..." : "SMS дахин илгээх"}
      </button>
      {message && (
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      )}
    </div>
  );
}

