export const BRANDS = [
  {
    id: "steam",
    name: "Steam",
    description: "PC тоглоомын платформ",
    slug: "steam",
    matchPatterns: ["steam"],
  },
  {
    id: "roblox",
    name: "Roblox",
    description: "Robux цэнэглэх",
    slug: "roblox",
    matchPatterns: ["roblox"],
  },
  {
    id: "pubg-mobile",
    name: "PUBG Mobile",
    description: "UC цэнэглэх",
    slug: "pubg-mobile",
  },
  {
    id: "pubg-new-state",
    name: "PUBG New State",
    description: "NC цэнэглэх",
    slug: "pubg-new-state",
  },
  {
    id: "minecraft",
    name: "Minecraft",
    description: "Minecraft карт",
    slug: "minecraft",
    matchPatterns: ["minecraft"],
  },
  {
    id: "nintendo",
    name: "Nintendo",
    description: "Nintendo eShop карт",
    slug: "nintendo",
    matchPatterns: ["nintendo"],
  },
  {
    id: "xbox",
    name: "Xbox",
    description: "Xbox карт",
    slug: "xbox",
    matchPatterns: ["xbox"],
  },
  {
    id: "playstation",
    name: "PlayStation",
    description: "PlayStation Store карт (US)",
    slug: "playstation",
    matchPatterns: ["playstation"],
  },
  {
    id: "riot-access-usa",
    name: "Riot Access USA",
    description: "Riot / VALORANT карт (US)",
    slug: "riot-access-usa",
    matchPatterns: ["riot access"],
  },
] as const;

export type BrandId = (typeof BRANDS)[number]["id"];

type ReloadlyProductRef = {
  brand: { brandName: string };
  productName: string;
};

export function matchReloadlyProduct(product: ReloadlyProductRef): BrandId | null {
  const brandLower = product.brand.brandName.toLowerCase();
  const nameLower = product.productName.toLowerCase();

  if (brandLower.includes("pubg") || nameLower.includes("pubg")) {
    if (nameLower.includes("new state")) return "pubg-new-state";
    if (nameLower.includes("mobile")) return "pubg-mobile";
    return null;
  }

  for (const brand of BRANDS) {
    if (!("matchPatterns" in brand) || !brand.matchPatterns) continue;
    if (
      brand.matchPatterns.some(
        (pattern) => brandLower.includes(pattern) || nameLower.includes(pattern)
      )
    ) {
      return brand.id;
    }
  }

  return null;
}

export function getBrandById(id: BrandId) {
  return BRANDS.find((b) => b.id === id);
}

export function formatProductLabel(brandId: BrandId, usd: number): string {
  const brand = getBrandById(brandId);
  if (!brand) return `$${usd}`;

  if (brandId === "pubg-mobile") {
    return `PUBG Mobile ${usd} UC`;
  }

  if (brandId === "pubg-new-state") {
    return `PUBG New State ${usd} NC`;
  }

  if (brandId === "riot-access-usa") {
    return `Riot Access USA $${usd}`;
  }

  return `${brand.name} $${usd}`;
}
