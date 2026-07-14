import { PricingOverview } from "@/components/admin/pricing-overview";
import { prisma } from "@/lib/prisma";
import { checkQPayHealth } from "@/lib/qpay";
import { getReloadlyAccountBalance } from "@/lib/reloadly";
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

type SystemStatus = {
  label: string;
  value: string;
  detail: string;
  status: "ok" | "warn" | "error";
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function runStatusCheck(
  label: string,
  check: () => Promise<Omit<SystemStatus, "label" | "status">>
): Promise<SystemStatus> {
  try {
    const result = await withTimeout(check(), 10_000, label);
    return { label, status: "ok", ...result };
  } catch (error) {
    return {
      label,
      value: "Алдаа",
      detail: errorMessage(error),
      status: "error",
    };
  }
}

function getVercelStatus(): SystemStatus {
  const env = process.env.VERCEL_ENV;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const url = process.env.VERCEL_URL;

  if (env === "production") {
    return {
      label: "Vercel production",
      value: "Ready",
      detail: commit ? `Commit ${commit}` : url ?? "Production deployment",
      status: "ok",
    };
  }

  if (env === "preview") {
    return {
      label: "Vercel production",
      value: "Preview",
      detail: commit ? `Commit ${commit}` : url ?? "Preview deployment",
      status: "warn",
    };
  }

  return {
    label: "Vercel production",
    value: "Local",
    detail: "Vercel env биш",
    status: "warn",
  };
}

async function getAdminSystemStatuses(): Promise<SystemStatus[]> {
  const [reloadly, neon, qpay] = await Promise.all([
    runStatusCheck("Reloadly balance", async () => {
      const balance = await getReloadlyAccountBalance();
      const available = Math.max(0, balance.balance - (balance.frozenBalance ?? 0));

      return {
        value: `${available.toFixed(2)} ${balance.currencyCode}`,
        detail:
          balance.frozenBalance && balance.frozenBalance > 0
            ? `Frozen ${balance.frozenBalance.toFixed(2)} ${balance.currencyCode}`
            : "Available",
      };
    }),
    runStatusCheck("Neon status", async () => {
      await prisma.$queryRaw`SELECT 1`;
      return {
        value: "Connected",
        detail: "Database query OK",
      };
    }),
    runStatusCheck("QPay status", async () => {
      await checkQPayHealth();
      return {
        value: "Connected",
        detail: "Auth OK",
      };
    }),
  ]);

  return [reloadly, getVercelStatus(), neon, qpay];
}

export default async function AdminDashboardPage() {
  const [systemStatuses, orderCounts, revenue, recentOrders, productCount] =
    await Promise.all([
      getAdminSystemStatuses(),
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
        {systemStatuses.map((status) => (
          <SystemStatusCard key={status.label} status={status} />
        ))}
      </div>

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

function SystemStatusCard({ status }: { status: SystemStatus }) {
  const statusClasses = {
    ok: "bg-success",
    warn: "bg-amber-500",
    error: "bg-danger",
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{status.label}</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${statusClasses[status.status]}`}
          aria-label={status.status}
        />
      </div>
      <p className="text-2xl font-bold mt-1">{status.value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={status.detail}>
        {status.detail}
      </p>
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
