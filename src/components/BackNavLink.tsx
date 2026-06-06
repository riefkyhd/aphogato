"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function BackNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(className)}>
      {children}
    </Link>
  );
}
