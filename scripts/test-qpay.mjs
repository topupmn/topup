import "dotenv/config";

const BASE_URL = process.env.QPAY_BASE_URL ?? "https://merchant-sandbox.qpay.mn";
const isProduction = BASE_URL.includes("merchant.qpay.mn") && !BASE_URL.includes("sandbox");

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

async function main() {
  console.log(`Testing QPay ${isProduction ? "PRODUCTION" : "sandbox"}...\n`);
  console.log(`  Base URL:     ${BASE_URL}`);
  console.log(`  Username:     ${mask(process.env.QPAY_USERNAME)}`);
  console.log(`  Invoice code: ${mask(process.env.QPAY_INVOICE_CODE)}`);
  console.log(`  Callback:     ${process.env.QPAY_CALLBACK_URL ?? "(missing)"}`);

  if (isProduction) {
    console.log("\n⚠️  PRODUCTION — invoice creation uses real QPay (pay only if you intend to test payment).");
    if (process.env.QPAY_CALLBACK_URL?.includes("localhost")) {
      console.log(
        "ℹ️  Callback is localhost — QPay cannot reach it. Order page polling still works after you pay."
      );
    }
  }

  if (
    !process.env.QPAY_USERNAME ||
    !process.env.QPAY_PASSWORD ||
    !process.env.QPAY_INVOICE_CODE
  ) {
    throw new Error("Set QPAY_USERNAME, QPAY_PASSWORD, and QPAY_INVOICE_CODE in .env");
  }

  const credentials = Buffer.from(
    `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
  ).toString("base64");

  const authRes = await fetch(`${BASE_URL}/v2/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!authRes.ok) {
    throw new Error(`Auth failed (${authRes.status}): ${await authRes.text()}`);
  }

  const { access_token } = await authRes.json();
  console.log("\n✓ Auth OK");

  const testAmount = Number(process.env.QPAY_TEST_AMOUNT ?? 100);
  const invoiceRes = await fetch(`${BASE_URL}/v2/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: `TEST-${Date.now()}`,
      invoice_receiver_code: "terminal",
      invoice_description: "topup.mn connection test",
      amount: testAmount,
      callback_url: process.env.QPAY_CALLBACK_URL,
    }),
  });

  if (!invoiceRes.ok) {
    throw new Error(
      `Invoice failed (${invoiceRes.status}): ${await invoiceRes.text()}`
    );
  }

  const invoice = await invoiceRes.json();
  console.log("✓ Invoice created:", invoice.invoice_id);
  console.log(`✓ Amount: ₮${testAmount.toLocaleString("mn-MN")}`);
  console.log(`✓ QR image: ${invoice.qr_image ? "yes" : "no"}`);
  console.log(`✓ Bank deeplinks: ${invoice.urls?.length ?? 0}`);

  if (invoice.qPay_shortUrl) {
    console.log(`✓ Short URL: ${invoice.qPay_shortUrl}`);
  }

  if (invoice.urls?.length) {
    console.log("\nBank links:");
    for (const url of invoice.urls.slice(0, 6)) {
      console.log(`  - ${url.description ?? url.name}`);
    }
  }

  console.log("\nQPay is configured correctly.");
  if (isProduction) {
    console.log(
      "\nNext: start the app, buy a product, pay the QR with your bank app (real MNT)."
    );
    console.log("Set NEXT_PUBLIC_ENABLE_TEST_PAYMENT=false so the sandbox button is hidden.");
  }
}

main().catch((err) => {
  console.error("\n✗ Failed:", err.message ?? err);
  process.exit(1);
});
