import { NextResponse } from "next/server";
import { processQPayPaymentReference } from "@/lib/qpay-callback";

function getReferenceFromUrl(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return (
    searchParams.get("sender_invoice_no") ??
    searchParams.get("invoiceid") ??
    searchParams.get("invoiceId") ??
    searchParams.get("invoice_id") ??
    searchParams.get("object_id") ??
    searchParams.get("orderNumber") ??
    searchParams.get("order_number")
  );
}

export async function GET(request: Request) {
  try {
    const reference = getReferenceFromUrl(request);

    if (!reference) {
      return new NextResponse("Missing invoice reference", { status: 400 });
    }

    const result = await processQPayPaymentReference(reference);

    if (result.status === "not_found") {
      return new NextResponse("Payment not found", { status: 404 });
    }

    return new NextResponse("SUCCESS", { status: 200 });
  } catch (error) {
    console.error("QPay callback error:", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId =
      body.invoice_id ??
      body.object_id ??
      body.sender_invoice_no ??
      body.invoiceid;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    const result = await processQPayPaymentReference(invoiceId);

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (result.status === "already_processed") {
      return NextResponse.json({ status: "already_processed" });
    }

    if (result.status === "not_paid") {
      return NextResponse.json({
        status: "not_paid",
        reason: result.reason,
        paidAmountMnt: result.paidAmountMnt,
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("QPay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
