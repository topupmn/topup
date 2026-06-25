import "dotenv/config";

const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";
const BASE_URL = "https://giftcards-sandbox.reloadly.com";

async function main() {
  console.log("Testing Reloadly sandbox connection...\n");

  const res = await fetch(RELOADLY_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.RELOADLY_CLIENT_ID,
      client_secret: process.env.RELOADLY_CLIENT_SECRET,
      grant_type: "client_credentials",
      audience: BASE_URL,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Auth failed (${res.status}): ${err}`);
  }

  const { access_token } = await res.json();
  console.log("✓ Auth OK — token received:", access_token.slice(0, 20) + "...");

  const productsRes = await fetch(`${BASE_URL}/products?countryCode=US&size=200`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!productsRes.ok) {
    throw new Error(`Products failed (${productsRes.status})`);
  }

  const { content } = await productsRes.json();
  console.log(`✓ Products API OK — ${content.length} US products available`);

  const gaming = content.filter((p) => {
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
    const denoms =
      p.fixedRecipientDenominations?.join(", $") ??
      (p.minRecipientDenomination != null
        ? `$${p.minRecipientDenomination}–$${p.maxRecipientDenomination}`
        : "none");
    console.log(
      `  [${p.productId}] ${p.brand.brandName} — ${p.productName} (${p.denominationType}: ${denoms})`
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
