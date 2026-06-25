"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatMnt } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  nameMn: string | null;
  brand: string;
  denominationUsd: number;
  priceMnt: number;
  imageUrl: string | null;
}

export function ProductGrid({ products }: { products: Product[] }) {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleBuy(productId: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Алдаа гарлаа");
      return;
    }

    router.push(`/orders/${data.orderId}`);
  }

  return (
    <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
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
          <p className="text-sm text-muted-foreground mt-1">
            ${product.denominationUsd} USD
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4 text-primary">
            {formatMnt(product.priceMnt)}
          </p>
          <Button
            onClick={() => handleBuy(product.id)}
            className="mt-auto pt-4 w-full"
          >
            Худалдан авах
          </Button>
        </div>
      ))}
    </div>
  );
}
