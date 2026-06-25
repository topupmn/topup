"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMnt } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalMnt: number;
  productName: string;
  createdAt: string;
  hasCode: boolean;
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

export default function OrdersPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (authStatus === "authenticated") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          setOrders(data);
          setLoading(false);
        });
    }
  }, [authStatus, router]);

  if (loading || authStatus === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Ачааллаж байна...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold">Миний захиалгууд</h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-muted-foreground">Захиалга байхгүй байна</p>
          <ButtonLink href="/products" className="mt-4">
            Карт худалдан авах
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-border bg-white p-4 sm:p-5 hover:shadow-md transition-shadow shadow-sm"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{order.productName}</p>
                  <p className="text-sm text-muted-foreground mt-1 break-all">
                    #{order.orderNumber}
                  </p>
                </div>
                <p className="font-bold shrink-0">{formatMnt(order.totalMnt)}</p>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center mt-3">
                <span className="text-sm text-muted-foreground">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
