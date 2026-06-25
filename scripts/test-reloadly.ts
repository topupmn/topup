import "dotenv/config";
import { getReloadlyToken, listReloadlyProducts } from "../src/lib/reloadly";

async function main() {
  console.log("Testing Reloadly sandbox connection...\n");

  const token = await getReloadlyToken();
  console.log("✓ Auth OK — token received:", token.slice(0, 20) + "...");

  const products = await listReloadlyProducts("US");
  console.log(`✓ Products API OK — ${products.length} US products available`);

  const gaming = products.filter((p) => {
    const b = p.brand.brandName.toLowerCase();
    return (
      b.includes("steam") ||
      b.includes("roblox") ||
      b.includes("pubg") ||
      b.includes("minecraft") ||
      b.includes("nintendo") ||
      b.includes("xbox") ||
      b.includes("playstation")
    );
  });

  console.log(`✓ Found ${gaming.length} gaming products:\n`);
  for (const p of gaming.slice(0, 10)) {
    console.log(
      `  [${p.productId}] ${p.brand.brandName} — ${p.productName} ($${p.minRecipientDenomination})`
    );
  }
  if (gaming.length > 10) {
    console.log(`  ... and ${gaming.length - 10} more`);
  }

  console.log("\nReloadly is configured correctly.");
}

main().catch((err) => {
  console.error("✗ Failed:", err.message ?? err);
  process.exit(1);
});
