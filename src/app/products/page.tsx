import { getBrandsWithImages } from "@/lib/brands";
import { BrandCard } from "@/components/products/brand-card";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const brands = await getBrandsWithImages();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold">Бүтээгдэхүүн</h1>
      <p className="mt-2 text-muted-foreground">
        Тоглоомын платформ сонгоод карт худалдан аваарай
      </p>

      <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} variant="large" />
        ))}
      </div>
    </div>
  );
}
