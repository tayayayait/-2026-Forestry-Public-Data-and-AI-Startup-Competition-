import * as React from "react";
import { Sun, CloudSun, AlertTriangle, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "env-good"
  | "env-moderate"
  | "env-bad"
  | "ai"
  | "level-easy"
  | "level-medium"
  | "level-hard"
  | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  icon?: LucideIcon | false;
}

const map: Record<Variant, { cls: string; icon: LucideIcon | null }> = {
  "env-good": {
    cls: "bg-[#D8F3DC] text-[#1B4332]",
    icon: Sun,
  },
  "env-moderate": {
    cls: "bg-[#FEFCBF] text-[#975A16]",
    icon: CloudSun,
  },
  "env-bad": {
    cls: "bg-[#FED7D7] text-[#9B2C2C]",
    icon: AlertTriangle,
  },
  ai: {
    cls: "text-white bg-[linear-gradient(135deg,#B197FC,#74C0FC)]",
    icon: Sparkles,
  },
  "level-easy": { cls: "bg-forest-50 text-forest-700", icon: null },
  "level-medium": { cls: "bg-[#FFF8E1] text-[#F57F17]", icon: null },
  "level-hard": { cls: "bg-[#FFF0F0] text-[#D32F2F]", icon: null },
  neutral: { cls: "bg-warm-beige text-text-secondary", icon: null },
};

export function Badge({ variant = "neutral", icon, className, children, ...props }: BadgeProps) {
  const config = map[variant];
  const Icon = icon === false ? null : (icon ?? config.icon);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tracking-wide",
        config.cls,
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}
