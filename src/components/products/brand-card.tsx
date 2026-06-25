import Image from "next/image";
import Link from "next/link";
import type { BrandWithImage } from "@/lib/brands";

interface BrandCardProps {
  brand: BrandWithImage;
  variant?: "compact" | "large";
}

export function BrandCard({ brand, variant = "compact" }: BrandCardProps) {
  const isLarge = variant === "large";

  return (
    <Link
      href={`/products/${brand.slug}`}
      className={`group rounded-2xl border border-border bg-white hover:shadow-md transition-shadow shadow-sm ${
        isLarge ? "p-5 sm:p-8" : "p-4 sm:p-6"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-muted ${
          isLarge ? "aspect-[16/10] mb-6" : "aspect-[4/3] mb-4"
        }`}
      >
        {brand.imageUrl ? (
          <Image
            src={brand.imageUrl}
            alt={brand.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground">
            {brand.name.charAt(0)}
          </div>
        )}
      </div>

      <h3
        className={`font-semibold group-hover:underline ${
          isLarge ? "text-xl" : "text-lg"
        }`}
      >
        {brand.name}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{brand.description}</p>
      {isLarge && (
        <p className="mt-4 text-sm font-medium text-primary">Сонгох →</p>
      )}
    </Link>
  );
}
