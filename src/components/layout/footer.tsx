import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">
              <span className="text-primary">topup</span>
              <span className="text-foreground">.mn</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Тоглоомын карт худалдан авах найдвартай платформ
            </p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Үйлчилгээний нөхцөл
            </Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Нууцлалын бодлого
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} topup.mn. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </footer>
  );
}
