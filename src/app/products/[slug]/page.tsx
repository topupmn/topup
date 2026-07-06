import { notFound } from "next/navigation";
import { BRANDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { applyReloadlyBalanceAvailability } from "@/lib/reloadly-balance";
import { ProductGrid } from "@/components/products/product-grid";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BrandProductsPage({ params }: Props) {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);

  if (!brand) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      brand: { equals: brand.id, mode: "insensitive" },
    },
    orderBy: { priceMnt: "asc" },
  });
  const productsWithAvailability =
    await applyReloadlyBalanceAvailability(products);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold">{brand.name}</h1>
      <p className="mt-2 text-muted-foreground">{brand.description}</p>

      {products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            Одоогоор бүтээгдэхүүн байхгүй байна. Удахгүй нэмэгдэнэ.
          </p>
        </div>
      ) : (
        <ProductGrid products={productsWithAvailability} />
      )}
    </div>
  );
}
