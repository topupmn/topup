import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_PRODUCTS = [
  {
    reloadlyId: 1,
    name: "Steam Wallet $10",
    nameMn: "Steam $10",
    brand: "steam",
    category: "gaming",
    countryCode: "US",
    denominationUsd: 10,
    priceMnt: 35000,
  },
  {
    reloadlyId: 2,
    name: "Steam Wallet $20",
    nameMn: "Steam $20",
    brand: "steam",
    category: "gaming",
    countryCode: "US",
    denominationUsd: 20,
    priceMnt: 70000,
  },
  {
    reloadlyId: 3,
    name: "Roblox $10",
    nameMn: "Roblox $10",
    brand: "roblox",
    category: "gaming",
    countryCode: "US",
    denominationUsd: 10,
    priceMnt: 36000,
  },
  {
    reloadlyId: 4,
    name: "PUBG Mobile 60 UC",
    nameMn: "PUBG Mobile 60 UC",
    brand: "pubg-mobile",
    category: "gaming",
    countryCode: "US",
    denominationUsd: 1,
    priceMnt: 5000,
  },
];

async function main() {
  console.log("Seeding products...");

  for (const product of SEED_PRODUCTS) {
    await prisma.product.upsert({
      where: {
        reloadlyId_denominationUsd: {
          reloadlyId: product.reloadlyId,
          denominationUsd: product.denominationUsd,
        },
      },
      update: product,
      create: product,
    });
  }

  console.log(`Seeded ${SEED_PRODUCTS.length} products`);
  console.log(
    "Note: Update reloadlyId values with actual Reloadly product IDs before going live."
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
