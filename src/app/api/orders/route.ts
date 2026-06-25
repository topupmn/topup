import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: true } },
        fulfillment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalMnt: order.totalMnt,
        productName: order.items[0]?.product.name ?? "",
        createdAt: order.createdAt,
        hasCode: order.fulfillment?.status === "SUCCESS",
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Захиалгууд авахад алдаа гарлаа" },
      { status: 500 }
    );
  }
}
