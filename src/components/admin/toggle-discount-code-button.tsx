"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleDiscountCodeButton({
  codeId,
  isActive,
}: {
  codeId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Алдаа гарлаа");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
    >
      {loading ? "..." : isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
    </button>
  );
}

