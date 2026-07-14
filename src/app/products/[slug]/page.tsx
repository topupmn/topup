import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRANDS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { applyReloadlyBalanceAvailability } from "@/lib/reloadly-balance";
import { ProductGrid } from "@/components/products/product-grid";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

const BRAND_SEO: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  steam: {
    title: "Steam карт авах - QPay төлбөртэй | topup.mn",
    description:
      "Монголд Steam gift card хурдан авах. Steam карт сонгоод утасны дугаараа оруулж QPay-ээр төлөөд кодоо аваарай.",
    keywords: [
      "Steam карт авах",
      "Steam gift card Mongolia",
      "Steam wallet code",
      "QPay Steam card",
    ],
  },
  roblox: {
    title: "Roblox карт авах - Robux gift card | topup.mn",
    description:
      "Roblox gift card болон Robux карт Монголд QPay-ээр авах. Код төлбөр баталгаажмагц дэлгэц дээр гарна.",
    keywords: [
      "Roblox карт авах",
      "Robux авах",
      "Roblox gift card Mongolia",
      "QPay Roblox",
    ],
  },
  "pubg-mobile": {
    title: "PUBG Mobile UC авах - QPay төлбөртэй | topup.mn",
    description:
      "PUBG Mobile UC карт Монголд QPay-ээр авах. UC кодоо хурдан, хялбар худалдан аваарай.",
    keywords: [
      "PUBG UC авах",
      "PUBG Mobile UC Mongolia",
      "PUBG карт",
      "QPay PUBG UC",
    ],
  },
  "pubg-new-state": {
    title: "PUBG New State NC авах | topup.mn",
    description:
      "PUBG New State NC карт QPay-ээр авах. Монгол хэрэглэгчдэд зориулсан тоглоомын картын үйлчилгээ.",
    keywords: ["PUBG New State NC", "NC авах", "PUBG New State карт"],
  },
  "riot-access-usa": {
    title: "Riot Access USA карт авах | VALORANT | topup.mn",
    description:
      "Riot Access USA карт QPay-ээр авах. VALORANT/Riot аккаунтын бүс таарах эсэхийг шалгана уу.",
    keywords: [
      "Valorant карт авах",
      "Riot Access USA",
      "Valorant points Mongolia",
      "QPay Valorant",
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = BRANDS.find((b) => b.slug === slug);

  if (!brand) {
    return createPageMetadata({
      title: "Бүтээгдэхүүн олдсонгүй | topup.mn",
      path: `/products/${slug}`,
    });
  }

  const seo = BRAND_SEO[brand.slug] ?? {
    title: `${brand.name} карт авах | topup.mn`,
    description: `${brand.name} тоглоомын карт QPay-ээр хурдан, хялбар худалдан аваарай.`,
    keywords: [
      `${brand.name} карт`,
      `${brand.name} gift card Mongolia`,
      "тоглоомын карт",
      "QPay",
    ],
  };

  return createPageMetadata({
    ...seo,
    path: `/products/${brand.slug}`,
  });
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
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Бүх бүтээгдэхүүн
      </Link>

      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{brand.name}</h1>
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
