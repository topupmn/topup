import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQPayInvoice } from "@/lib/qpay";
import {
  generateOrderNumber,
  getOrderExpiryDate,
} from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const { productId } = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Бүтээгдэхүүн олдсонгүй" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
    }

    const orderNumber = generateOrderNumber();
    const expiresAt = getOrderExpiryDate();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        totalMnt: product.priceMnt,
        email: user.email,
        phone: user.phone,
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
      amount: product.priceMnt,
      description: `${product.name} - ${orderNumber}`,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        qpayInvoiceId: invoice.invoice_id,
        qpayQrText: invoice.qr_text,
        qpayQrImage: invoice.qr_image,
        qpayBankUrls: invoice.urls as unknown as Prisma.InputJsonValue,
        amountMnt: product.priceMnt,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: product.priceMnt,
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
