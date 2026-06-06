"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePendingNav } from "@/components/navigation/PendingNavProvider";
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
  const { startNavigation, isPending } = usePendingNav();
  const active = navIsActive(pathname, href);
  const pending = isPending(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-busy={pending}
      onClick={() => {
        startNavigation(href);
        onClick?.();
      }}
      className={cn(
        baseClass,
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
        pending && "text-text-primary opacity-70",
        className
      )}
    >
      <span className={cn("inline-flex items-center gap-1.5", pending && "relative")}>
        {pending ? (
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary animate-pulse"
            aria-hidden
          />
        ) : null}
        {children}
      </span>
    </Link>
  );
}
