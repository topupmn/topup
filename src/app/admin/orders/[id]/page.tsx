import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/utils";
import { RetryFulfillmentButton } from "@/components/admin/retry-fulfillment-button";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Төлбөр хүлээгдэж байна",
  PAID: "Төлөгдсөн",
  FULFILLING: "Код бэлтгэж байна",
  DELIVERED: "Хүргэгдсэн",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  CANCELLED: "Цуцлагдсан",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: { include: { product: true } },
      payment: true,
      fulfillment: true,
    },
  });

  if (!order) notFound();

  const canRetry =
    order.payment?.status === "PAID" &&
    (order.status === "FAILED" ||
      order.fulfillment?.status === "FAILED" ||
      (order.status === "PAID" && !order.fulfillment));

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Захиалгууд
      </Link>

      <h1 className="text-2xl font-bold mt-4">{order.orderNumber}</h1>
      <p className="text-muted-foreground">
        {STATUS_LABELS[order.status] ?? order.status} · {formatMnt(order.totalMnt)}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="Захиалга">
          <Row label="Бүтээгдэхүүн" value={order.items[0]?.product.name ?? "—"} />
          <Row label="Имэйл" value={order.email} />
          <Row label="Утас" value={order.phone ?? "—"} />
          <Row
            label="Үүсгэсэн"
            value={new Date(order.createdAt).toLocaleString("mn-MN")}
          />
        </Section>

        <Section title="Хэрэглэгч">
          <Row label="Нэр" value={order.user.name ?? "—"} />
          <Row label="Имэйл" value={order.user.email} />
        </Section>

        <Section title="Төлбөр (QPay)">
          <Row label="Төлөв" value={order.payment?.status ?? "—"} />
          <Row
            label="Invoice ID"
            value={order.payment?.qpayInvoiceId ?? "—"}
          />
          <Row
            label="Төлсөн огноо"
            value={
              order.payment?.paidAt
                ? new Date(order.payment.paidAt).toLocaleString("mn-MN")
                : "—"
            }
          />
        </Section>

        <Section title="Хүргэлт (Reloadly)">
          <Row label="Төлөв" value={order.fulfillment?.status ?? "—"} />
          <Row
            label="Reloadly ID"
            value={order.fulfillment?.reloadlyTransactionId ?? "—"}
          />
          {order.fulfillment?.cardCode && (
            <Row label="Код" value={order.fulfillment.cardCode} mono />
          )}
          {order.fulfillment?.cardPin && (
            <Row label="PIN" value={order.fulfillment.cardPin} mono />
          )}
          {order.fulfillment?.errorMessage && (
            <Row label="Алдаа" value={order.fulfillment.errorMessage} />
          )}
        </Section>
      </div>

      {canRetry && (
        <div className="mt-8 rounded-xl border border-border bg-white p-5">
          <h3 className="font-semibold">Дахин оролдох</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Төлбөр төлөгдсөн боловч код хүргэгдээгүй бол дахин Reloadly-ээр
            захиална.
          </p>
          <RetryFulfillmentButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      <dl className="space-y-3">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-sm mt-0.5 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
