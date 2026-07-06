import { PricingOverview } from "@/components/admin/pricing-overview";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Төлбөр хүлээгдэж байна",
  PAID: "Төлөгдсөн",
  FULFILLING: "Код бэлтгэж байна",
  DELIVERED: "Хүргэгдсэн",
  FULFILLMENT_FAILED: "Код хүргэлт амжилтгүй",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  CANCELLED: "Цуцлагдсан",
};

export default async function AdminDashboardPage() {
  const [orderCounts, revenue, recentOrders, productCount] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountMnt: true },
      _count: true,
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const statusMap = Object.fromEntries(
    orderCounts.map((s) => [s.status, s._count])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Хяналтын самбар</h1>
      <p className="text-muted-foreground mt-1">Захиалга, төлбөр, бүтээгдэхүүн</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Нийт орлого"
          value={formatMnt(revenue._sum.amountMnt ?? 0)}
        />
        <StatCard
          label="Төлөгдсөн захиалга"
          value={String(revenue._count)}
        />
        <StatCard
          label="Хүргэгдсэн"
          value={String(statusMap.DELIVERED ?? 0)}
        />
        <StatCard label="Идэвхтэй бүтээгдэхүүн" value={String(productCount)} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <MiniStat label="Хүлээгдэж буй" value={statusMap.PENDING_PAYMENT ?? 0} />
        <MiniStat label="Бэлтгэж буй" value={statusMap.FULFILLING ?? 0} />
        <MiniStat
          label="Код алдаа"
          value={statusMap.FULFILLMENT_FAILED ?? 0}
        />
        <MiniStat label="Амжилтгүй" value={statusMap.FAILED ?? 0} />
      </div>

      <PricingOverview compact />

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Сүүлийн захиалгууд</h2>
          <Link href="/admin/orders" className="text-sm underline">
            Бүгдийг харах
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Захиалга</th>
                  <th className="px-4 py-3 font-medium">Хэрэглэгч</th>
                  <th className="px-4 py-3 font-medium">Бүтээгдэхүүн</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 font-medium text-right">Дүн</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.user?.email ?? order.email ?? order.phone}
                    </td>
                    <td className="px-4 py-3">
                      {order.items[0]?.product.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_LABELS[order.status] ?? order.status}
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
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
