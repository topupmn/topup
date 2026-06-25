import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary:
    "border border-border bg-white text-foreground hover:bg-white/90 shadow-sm",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-white/60",
} as const;

type Variant = keyof typeof variants;

function classNames(variant: Variant, className?: string) {
  return [base, variants[variant], className].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button className={classNames(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={classNames(variant, className)}>
      {children}
    </Link>
  );
}
