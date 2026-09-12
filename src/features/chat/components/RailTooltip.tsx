import { cn } from "@/shared/lib/cn";

export type RailTooltipProps = {
  label: string;
  shortcut?: string;
  y: number;
  x?: number;
  placement?: "side" | "bottom";
};

export const RailTooltip = ({
  label,
  shortcut,
  y,
  x = 72,
  placement = "side",
}: RailTooltipProps) => (
  <span
    className={cn(
      "pointer-events-none fixed z-[999] flex items-center gap-2 whitespace-nowrap rounded-full bg-gray-900 px-3.5 py-2 text-sm font-extrabold text-white shadow-xl",
      placement === "bottom" ? "-translate-x-1/2" : "-translate-y-1/2",
    )}
    style={{ left: x, top: y }}
  >
    {label}

    {shortcut && (
      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-black text-white/75">
        {shortcut}
      </span>
    )}
  </span>
);
