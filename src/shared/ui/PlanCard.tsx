import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

export type PlanCardProps = {
  actionLabel?: ReactNode;
  badge?: ReactNode;
  className?: string;
  description?: ReactNode;
  features?: readonly string[];
  highlighted?: boolean;
  href?: string;
  id?: string;
  onSelect?: () => void;
  planName: ReactNode;
  price: ReactNode;
  priceUnit?: ReactNode;
};

export const PlanCard = ({
  actionLabel,
  badge,
  className,
  description,
  features = [],
  highlighted = false,
  href,
  onSelect,
  planName,
  price,
  priceUnit = "원/월",
}: PlanCardProps) => (
  <Card
    variant={highlighted ? "accent" : "default"}
    padding="md"
    className={cn("w-[220px] max-w-full shrink-0", className)}
  >
    <div className="flex justify-between">
      <p className="text-sm font-extrabold text-gray-950 dark:text-white">
        {planName}
      </p>
      {badge && (
        <p
          className={cn(
            "mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold",
            highlighted
              ? "bg-brand text-white"
              : "bg-surface-muted text-text-secondary dark:bg-white/10",
          )}
        >
          {badge}
        </p>
      )}
    </div>

    {description && (
      <p className="text-text-secondary mt-1 text-xs leading-5">
        {description}
      </p>
    )}

    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-brand text-2xl font-black">{price}</span>
      <span className="text-text-secondary text-xs font-bold">{priceUnit}</span>
    </div>

    {features.length > 0 && (
      <ul className="border-border-soft mt-4 space-y-1.5 border-t pt-3 dark:border-white/10">
        {features.map((feature) => (
          <li
            key={feature}
            className="text-text-primary flex items-start gap-1.5 text-xs leading-5 font-medium"
          >
            <Check size={14} className="text-brand mt-0.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    )}

    {actionLabel &&
      (href ? (
        <ButtonLink href={href} size="sm" fullWidth className="mt-4">
          {actionLabel}
        </ButtonLink>
      ) : (
        <Button size="sm" fullWidth className="mt-4" onClick={onSelect}>
          {actionLabel}
        </Button>
      ))}
  </Card>
);

export type PlanCardGroupProps = {
  className?: string;
  plans: readonly PlanCardProps[];
};

/**
 * 채팅 답변처럼 좁은 영역에서 요금제 3~4개를 가로로 나열할 때 쓰는 래퍼입니다.
 * 폭이 부족하면 가로 스크롤됩니다.
 */
export const PlanCardGroup = ({ className, plans }: PlanCardGroupProps) => (
  <div className={cn("-mx-1 flex gap-3 overflow-x-auto px-1 pb-1", className)}>
    {plans.map((plan, index) => (
      <PlanCard key={plan.id ?? index} {...plan} />
    ))}
  </div>
);
