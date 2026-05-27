import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "highlight" | "ai" | "compact";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  interactive?: boolean;
}

const variantClass: Record<Variant, string> = {
  default: "bg-white border border-border-default rounded-2xl shadow-card p-4",
  highlight: "bg-forest-50 border border-forest-100 rounded-2xl shadow-card p-4",
  ai: "card-ai-border shadow-lg p-5",
  compact: "bg-white border border-border-default rounded-xl shadow-sm p-3",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", interactive, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variantClass[variant],
        interactive &&
          "cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
