import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  getReloadlyToken,
  listReloadlyProducts,
  getProductDenominations,
} from "../src/lib/reloadly";
import {
  BRANDS,
  matchReloadlyProduct,
  formatProductLabel,
} from "../src/lib/constants";
import {
  calculatePriceMnt,
} from "../src/lib/pricing";
import { getPricingConfig } from "../src/lib/site-settings";

const prisma = new PrismaClient();

async function main() {
  const config = await getPricingConfig();
  const { mntUsdRate, markupPercent } = config;
  console.log("Reloadly product sync");
  console.log(`Rate: ₮${mntUsdRate}/USD, markup: ${markupPercent}%`);
  console.log(`Brands: ${BRANDS.map((b) => b.name).join(", ")}\n`);

  await getReloadlyToken();
  console.log("✓ Reloadly authentication successful");

  // Deactivate legacy single "pubg" brand products
  const deactivated = await prisma.product.updateMany({
    where: { brand: "pubg" },
    data: { isActive: false },
  });
  if (deactivated.count > 0) {
    console.log(`✓ Deactivated ${deactivated.count} legacy pubg products\n`);
  }

  const allProducts = await listReloadlyProducts("US");
  console.log(`✓ Fetched ${allProducts.length} products from Reloadly (US)`);

  const matched = allProducts.filter((p) => matchReloadlyProduct(p) !== null);
  console.log(`✓ Found ${matched.length} matching product lines\n`);

  if (matched.length === 0) {
    console.log("No matching products found. Check Reloadly catalog.");
    return;
  }

  let synced = 0;

  for (const product of matched) {
    const brandKey = matchReloadlyProduct(product);
    if (!brandKey) continue;

    const denominations = getProductDenominations(product);
    if (denominations.length === 0) {
      console.log(
        `  ⚠ Skipped ${product.productName} (ID ${product.productId}) — no denominations`
      );
      continue;
    }

    for (const denomination of denominations) {
      const priceMnt = calculatePriceMnt(denomination, config);
      const displayName = formatProductLabel(brandKey, denomination);

      await prisma.product.upsert({
        where: {
          reloadlyId_denominationUsd: {
            reloadlyId: product.productId,
            denominationUsd: denomination,
          },
        },
        update: {
          name: displayName,
          nameMn: displayName,
          brand: brandKey,
          category: "gaming",
          countryCode: product.country.isoName,
          priceMnt,
          imageUrl: product.logoUrls?.[0] ?? null,
          isActive: true,
        },
        create: {
          reloadlyId: product.productId,
          name: displayName,
          nameMn: displayName,
          brand: brandKey,
          category: "gaming",
          countryCode: product.country.isoName,
          denominationUsd: denomination,
          priceMnt,
          imageUrl: product.logoUrls?.[0] ?? null,
          isActive: true,
        },
      });

      console.log(
        `  ${displayName} → ₮${priceMnt.toLocaleString()} (Reloadly ${product.productId})`
      );
      synced++;
    }
  }

  console.log(`\n✓ Synced ${synced} products to database`);
}

main()
  .catch((err) => {
    console.error("Sync failed:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
