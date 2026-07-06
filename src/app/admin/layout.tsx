import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";

const NAV = [
  { href: "/admin", label: "Хяналтын самбар" },
  { href: "/admin/orders", label: "Захиалгууд" },
  { href: "/admin/products", label: "Бүтээгдэхүүн" },
  { href: "/admin/discount-codes", label: "Хөнгөлөлт" },
  { href: "/admin/pricing", label: "Ханш, үнэ" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              topup.mn Admin
            </Link>
            <nav className="hidden sm:flex gap-4 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Сайт руу буцах
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
