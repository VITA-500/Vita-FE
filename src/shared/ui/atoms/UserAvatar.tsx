import { UserRound } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const sizeStyles = {
  xs: {
    container: "h-7 w-7",
    icon: 15,
  },
  sm: {
    container: "h-8 w-8",
    icon: 17,
  },
  md: {
    container: "h-9 w-9",
    icon: 19,
  },
  lg: {
    container: "h-20 w-20",
    icon: 40,
  },
} as const;

type UserAvatarProps = {
  className?: string;
  size?: keyof typeof sizeStyles;
};

export const UserAvatar = ({ className, size = "sm" }: UserAvatarProps) => {
  const styles = sizeStyles[size];

  return (
    <span
      className={cn(
        "bg-brand shadow-brand/20 flex shrink-0 items-center justify-center rounded-full text-white shadow-sm",
        styles.container,
        className,
      )}
      aria-hidden="true"
    >
      <UserRound size={styles.icon} strokeWidth={2.2} />
    </span>
  );
};
