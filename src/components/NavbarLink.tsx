"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navIsActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

const baseClass =
  "text-[12px] uppercase tracking-label transition-colors";

export function NavbarLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = navIsActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        baseClass,
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
        className
      )}
    >
      {children}
    </Link>
  );
}
