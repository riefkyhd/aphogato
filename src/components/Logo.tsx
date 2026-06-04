import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/logo/MH_logo.png";

const sizes = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-[72px] w-[72px]",
} as const;

export function Logo({
  size = "sm",
  href,
  className,
  priority = false,
}: {
  size?: keyof typeof sizes;
  href?: string;
  className?: string;
  priority?: boolean;
}) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt="Muhammad Hadid"
      width={612}
      height={612}
      priority={priority}
      className={cn(sizes[size], "object-contain", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return image;
}
