import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { listReloadlyProducts } from "./reloadly";
import { BRANDS, matchReloadlyProduct, type BrandId } from "./constants";

export type BrandWithImage = (typeof BRANDS)[number] & {
  imageUrl: string | null;
};

const getReloadlyBrandImages = unstable_cache(
  async (): Promise<Record<BrandId, string>> => {
    const images = {} as Record<BrandId, string>;

    try {
      const products = await listReloadlyProducts("US");

      for (const product of products) {
        const brandId = matchReloadlyProduct(product);
        const logo = product.logoUrls?.[0];
        if (!brandId || !logo || images[brandId]) continue;
        images[brandId] = logo;
      }
    } catch {
      // Reloadly unavailable — fall back to DB images only
    }

    return images;
  },
  ["reloadly-brand-images"],
  { revalidate: 3600 }
);

export async function getBrandsWithImages(): Promise<BrandWithImage[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, imageUrl: { not: null } },
    select: { brand: true, imageUrl: true },
    orderBy: { denominationUsd: "asc" },
  });

  const imageByBrand = new Map<string, string>();
  for (const product of products) {
    if (product.imageUrl && !imageByBrand.has(product.brand)) {
      imageByBrand.set(product.brand, product.imageUrl);
    }
  }

  const reloadlyImages = await getReloadlyBrandImages();

  return BRANDS.map((brand) => ({
    ...brand,
    imageUrl:
      imageByBrand.get(brand.id) ?? reloadlyImages[brand.id] ?? null,
  }));
}
