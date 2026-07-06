"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-lg sm:text-xl font-bold tracking-tight shrink-0"
        >
          <Image
            src="/logo-mark.png"
            alt=""
            width={390}
            height={594}
            className="h-[0.62em] w-auto translate-y-[1px] object-contain"
            priority
          />
          <span>
            <span className="text-primary">topup</span>
            <span className="text-foreground">.mn</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
