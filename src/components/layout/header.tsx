"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ButtonLink } from "@/components/ui/button";

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex min-h-11 items-center text-muted-foreground hover:text-primary transition-colors font-medium"
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg sm:text-xl font-bold tracking-tight shrink-0"
        >
          <span className="text-primary">topup</span>
          <span className="text-foreground">.mn</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink href="/products">Бүтээгдэхүүн</NavLink>

          {status === "loading" ? (
            <span className="text-muted-foreground">...</span>
          ) : session ? (
            <>
              <NavLink href="/orders">Захиалгууд</NavLink>
              <span className="text-muted-foreground truncate max-w-[140px]">
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-primary transition-colors min-h-11 font-medium"
              >
                Гарах
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">Нэвтрэх</NavLink>
              <ButtonLink href="/register">Бүртгүүлэх</ButtonLink>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Цэс хаах" : "Цэс нээх"}
        >
          {menuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-white px-4 py-4 space-y-1">
          <NavLink href="/products" onClick={closeMenu}>
            Бүтээгдэхүүн
          </NavLink>

          {status === "loading" ? (
            <p className="py-2 text-muted-foreground">...</p>
          ) : session ? (
            <>
              <NavLink href="/orders" onClick={closeMenu}>
                Захиалгууд
              </NavLink>
              <p className="py-2 text-sm text-muted-foreground truncate">
                {session.user?.name ?? session.user?.email}
              </p>
              <button
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
                className="flex min-h-11 w-full items-center text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Гарах
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <NavLink href="/login" onClick={closeMenu}>
                Нэвтрэх
              </NavLink>
              <ButtonLink href="/register" onClick={closeMenu} className="w-full">
                Бүртгүүлэх
              </ButtonLink>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
