import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";

type LogoProps = {
  className?: string;
  heightClassName?: string;
  priority?: boolean;
  href?: string;
  alt?: string;
  onClick?: () => void;
};

export const Logo = ({
  className,
  heightClassName = "h-11",
  priority,
  href = "/",
  alt = "VITA 로고",
  onClick,
}: LogoProps) => {
  const image = (
    <Image
      src="/images/logo.webp"
      alt={alt}
      width={88}
      height={74}
      priority={priority}
      loading="eager"
      className={cn(heightClassName, "w-auto")}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("inline-flex items-center", className)}
    >
      {image}
    </Link>
  );
};
