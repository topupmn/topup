"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleProductButton({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 ${
        isActive
          ? "border-border bg-white hover:bg-accent"
          : "border-success/30 bg-success/10 text-success"
      }`}
    >
      {loading ? "..." : isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
    </button>
  );
}
