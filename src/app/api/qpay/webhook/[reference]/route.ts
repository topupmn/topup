import { NextResponse } from "next/server";
import { processQPayPaymentReference } from "@/lib/qpay-callback";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
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

