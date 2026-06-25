"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMnt } from "@/lib/utils";
import {
  QPayPayment,
  type QPayBankLink,
} from "@/components/payment/qpay-payment";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalMnt: number;
  product: { name: string; nameMn: string | null } | null;
  payment: {
    status: string;
    qrText: string | null;
    qrImage: string | null;
    bankUrls: QPayBankLink[];
  } | null;
  fulfillment: {
    status: string;
    cardCode: string | null;
    cardPin: string | null;
  } | null;
  expiresAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Төлбөр хүлээгдэж байна",
  PAID: "Төлбөр төлөгдсөн",
  FULFILLING: "Код бэлтгэж байна",
  DELIVERED: "Хүргэгдсэн",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  CANCELLED: "Цуцлагдсан",
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const testPaymentEnabled =
    process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENT === "true";

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus === "authenticated" && orderId) {
      fetchOrder();
    }
  }, [authStatus, orderId, router, fetchOrder]);

  useEffect(() => {
    if (!order || order.status === "DELIVERED" || order.status === "FAILED") {
      return;
    }

    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  async function handleSimulatePayment() {
    if (!orderId) return;
    setSimulating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/simulate-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Алдаа гарлаа");
        return;
      }
      await fetchOrder();
    } finally {
      setSimulating(false);
    }
  }

  if (loading || authStatus === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        Ачааллаж байна...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Захиалга олдсонгүй</p>
        <Link href="/orders" className="mt-4 inline-block underline">
          Захиалгууд руу буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <Link
        href="/orders"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Захиалгууд
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mt-2 break-all">
        Захиалга #{order.orderNumber}
      </h1>
      <p className="mt-1 text-muted-foreground">{order.product?.name}</p>

      <div className="mt-6 rounded-xl border border-border p-4 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Төлөв</span>
          <span className="font-medium text-right text-sm sm:text-base">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-sm text-muted-foreground">Дүн</span>
          <span className="font-bold text-lg">{formatMnt(order.totalMnt)}</span>
        </div>
      </div>

      {order.status === "PENDING_PAYMENT" && order.payment?.qrImage && (
        <>
          <QPayPayment
            qrImage={order.payment.qrImage}
            bankUrls={order.payment.bankUrls}
            amountMnt={order.totalMnt}
          />
          {testPaymentEnabled && (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Sandbox туршилт — бодит төлбөргүй
              </p>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 min-h-11"
              >
                {simulating ? "Боловсруулж байна..." : "Төлбөр төлөгдсөн гэж тэмдэглэх"}
              </button>
            </div>
          )}
        </>
      )}

      {(order.status === "PAID" || order.status === "FULFILLING") && (
        <div className="mt-8 rounded-xl border border-border bg-muted/50 p-6 text-center">
          <p className="text-muted-foreground">
            Төлбөр баталгаажлаа. Код бэлтгэж байна...
          </p>
        </div>
      )}

      {order.status === "DELIVERED" && order.fulfillment?.cardCode && (
        <div className="mt-8 rounded-xl border-2 border-success bg-green-50 p-4 sm:p-6">
          <p className="font-semibold text-success mb-4">Таны картын код:</p>
          <div className="bg-white rounded-lg border border-border p-3 sm:p-4 font-mono text-sm sm:text-lg break-all select-all">
            {order.fulfillment.cardCode}
          </div>
          {order.fulfillment.cardPin && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">PIN код:</p>
              <div className="bg-white rounded-lg border border-border p-3 sm:p-4 font-mono text-sm sm:text-lg break-all select-all">
                {order.fulfillment.cardPin}
              </div>
            </div>
          )}
        </div>
      )}

      {order.status === "FAILED" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-center">
          <p className="text-danger font-medium">
            Захиалга амжилтгүй боллоо. Та дэмжлэгтэй холбогдоно уу.
          </p>
        </div>
      )}
    </div>
  );
}
