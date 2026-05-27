import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-forest-700 text-white hover:bg-forest-900 hover:shadow-md active:bg-forest-900",
  secondary: "bg-transparent text-forest-700 border-[1.5px] border-forest-700 hover:bg-forest-50",
  ghost: "bg-transparent text-text-secondary hover:bg-warm-beige",
  danger: "bg-coral text-white hover:opacity-90",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] font-medium rounded-lg",
  md: "h-10 px-4 text-sm font-semibold rounded-xl",
  lg: "h-12 px-6 text-base font-semibold rounded-xl",
  xl: "h-14 px-8 text-base font-bold rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-[background-color,box-shadow,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
