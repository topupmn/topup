import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQPayInvoice } from "@/lib/qpay";
import { calculateDiscountMnt, getActiveDiscount } from "@/lib/discounts";
import { createGuestAccessToken, hashGuestAccessToken } from "@/lib/guest-token";
import { normalizeMongolianPhone, getMongolianPhoneError } from "@/lib/phone";
import { forbidCrossSiteRequest } from "@/lib/request-security";
import { getReloadlyBalanceAvailability } from "@/lib/reloadly-balance";
import { buildGuestOrderPath } from "@/lib/sms";
import {
  generateOrderNumber,
  getOrderExpiryDate,
} from "@/lib/utils";

export async function POST(request: Request) {
  const crossSiteResponse = forbidCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  try {
    const session = await getServerSession(authOptions);
    const { productId, discountCode, phone } = await request.json();
    const phoneError = getMongolianPhoneError(String(phone ?? ""));

    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
    }

    const normalizedPhone = normalizeMongolianPhone(String(phone ?? ""));

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Утасны дугаар буруу байна" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Бүтээгдэхүүн олдсонгүй" },
        { status: 404 }
      );
    }

    const balanceAvailability = await getReloadlyBalanceAvailability(
      product.denominationUsd
    );

    if (!balanceAvailability.available) {
      return NextResponse.json(
        {
          error:
            balanceAvailability.reason === "insufficient_balance"
              ? "Энэ карт одоогоор үлдэгдэл хүрэлцэхгүй байна"
              : "Reloadly үлдэгдэл шалгах боломжгүй байна. Түр хүлээгээд дахин оролдоно уу",
        },
        { status: balanceAvailability.reason === "insufficient_balance" ? 400 : 503 }
      );
    }

    const user = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id } })
      : null;

    const orderNumber = generateOrderNumber();
    const expiresAt = getOrderExpiryDate();
    const guestAccessToken = createGuestAccessToken();
    const discount =
      typeof discountCode === "string" && discountCode.trim()
        ? await getActiveDiscount(discountCode)
        : null;

    if (typeof discountCode === "string" && discountCode.trim() && !discount) {
      return NextResponse.json(
        { error: "Хөнгөлөлтийн код буруу эсвэл идэвхгүй байна" },
        { status: 400 }
      );
    }

    const discountMnt = discount
      ? calculateDiscountMnt(product.priceMnt, discount.discountPercent)
      : 0;
    const totalMnt = product.priceMnt - discountMnt;

    if (totalMnt <= 0) {
      return NextResponse.json(
        { error: "Хөнгөлөлтийн дараах дүн буруу байна" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id,
        subtotalMnt: product.priceMnt,
        discountMnt,
        discountCode: discount?.code,
        discountPercent: discount?.discountPercent,
        totalMnt,
        email: user?.email,
        phone: normalizedPhone,
        guestAccessTokenHash: hashGuestAccessToken(guestAccessToken),
        expiresAt,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            unitMnt: product.priceMnt,
            totalMnt: product.priceMnt,
          },
        },
      },
      include: { items: { include: { product: true } } },
    });

    const invoice = await createQPayInvoice({
      senderInvoiceNo: orderNumber,
      amount: totalMnt,
      description: `${product.name} - ${orderNumber}`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        qpayInvoiceId: invoice.invoice_id,
        qpayQrText: invoice.qr_text,
        qpayQrImage: invoice.qr_image,
        qpayBankUrls: invoice.urls as unknown as Prisma.InputJsonValue,
        amountMnt: totalMnt,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totalMnt,
      subtotalMnt: product.priceMnt,
      discountMnt,
      discountCode: discount?.code ?? null,
      discountPercent: discount?.discountPercent ?? null,
      orderUrl: buildGuestOrderPath(order.id, guestAccessToken),
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Захиалга үүсгэхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
