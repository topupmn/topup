"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  subtotalMnt: number;
  discountMnt: number;
  discountCode: string | null;
  discountPercent: number | null;
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
  FULFILLMENT_FAILED: "Код хүргэлт саатсан",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  CANCELLED: "Цуцлагдсан",
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingTransaction, setCheckingTransaction] = useState(false);

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    const token = searchParams.get("token");
    const url = token
      ? `/api/orders/${orderId}?token=${encodeURIComponent(token)}`
      : `/api/orders/${orderId}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
    }
    setLoading(false);
  }, [orderId, searchParams]);

  useEffect(() => {
    if (orderId) {
      const timeout = window.setTimeout(() => {
        void fetchOrder();
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (
      !order ||
      order.status === "DELIVERED" ||
      order.status === "FAILED" ||
      order.status === "FULFILLMENT_FAILED"
    ) {
      return;
    }

    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  async function handleCheckTransaction() {
    setCheckingTransaction(true);
    try {
      await fetchOrder();
    } finally {
      setCheckingTransaction(false);
    }
  }

  if (loading) {
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
        href="/products"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Бүтээгдэхүүн
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mt-2 break-all">
        Захиалга #{order.orderNumber}
      </h1>
      <p className="mt-1 text-muted-foreground">{order.product?.name}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Код дэлгэц дээр гарах тул хуудас бүү хаагаарай
      </p>

      <div className="mt-6 rounded-xl border border-border p-4 space-y-3">
        <div className="flex justify-between items-start gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Төлөв</span>
          <span className="font-medium text-right text-sm sm:text-base">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-sm text-muted-foreground">Үндсэн үнэ</span>
          <span className="font-medium">{formatMnt(order.subtotalMnt)}</span>
        </div>
        {order.discountMnt > 0 && (
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Хөнгөлөлт {order.discountCode ? `(${order.discountCode})` : ""}
            </span>
            <span className="font-medium text-success">
              -{formatMnt(order.discountMnt)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center gap-3">
          <span className="text-sm text-muted-foreground">Төлөх дүн</span>
          <span className="font-bold text-lg">{formatMnt(order.totalMnt)}</span>
        </div>
      </div>

      {order.status === "PENDING_PAYMENT" && order.payment?.qrImage && (
        <>
          <QPayPayment
            qrImage={order.payment.qrImage}
            bankUrls={order.payment.bankUrls}
            amountMnt={order.totalMnt}
            checkingTransaction={checkingTransaction}
            onCheckTransaction={handleCheckTransaction}
          />
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

      {(order.status === "FAILED" || order.status === "FULFILLMENT_FAILED") && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-center">
          <p className="text-danger font-medium">
            Захиалга амжилтгүй боллоо. Та дэмжлэгтэй холбогдоно уу.
          </p>
        </div>
      )}
    </div>
  );
}
