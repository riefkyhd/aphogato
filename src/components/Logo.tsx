import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/logo/MH_logo.png";

const sizes = {
  sm: { box: "h-7 w-7", px: 28 },
  md: { box: "h-10 w-10", px: 40 },
  lg: { box: "h-[72px] w-[72px]", px: 72 },
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
  const { box, px } = sizes[size];
  const image = (
    <Image
      src={LOGO_SRC}
      alt="Muhammad Hadid"
      width={px}
      height={px}
      priority={priority}
      className={cn(box, "object-contain", className)}
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
