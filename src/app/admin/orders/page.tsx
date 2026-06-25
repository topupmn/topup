import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Төлбөр хүлээгдэж байна",
  PAID: "Төлөгдсөн",
  FULFILLING: "Код бэлтгэж байна",
  DELIVERED: "Хүргэгдсэн",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  CANCELLED: "Цуцлагдсан",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      items: { include: { product: true } },
      payment: true,
      fulfillment: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Захиалгууд</h1>
      <p className="text-muted-foreground mt-1">{orders.length} захиалга</p>

      <div className="mt-8 rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Захиалга</th>
                <th className="px-4 py-3 font-medium">Огноо</th>
                <th className="px-4 py-3 font-medium">Хэрэглэгч</th>
                <th className="px-4 py-3 font-medium">Бүтээгдэхүүн</th>
                <th className="px-4 py-3 font-medium">Төлөв</th>
                <th className="px-4 py-3 font-medium">Төлбөр</th>
                <th className="px-4 py-3 font-medium text-right">Дүн</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleString("mn-MN")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.user.email}
                  </td>
                  <td className="px-4 py-3">
                    {order.items[0]?.product.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.payment?.status ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMnt(order.totalMnt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
