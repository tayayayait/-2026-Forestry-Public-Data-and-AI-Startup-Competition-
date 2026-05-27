import { LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationFABProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function LocationFAB({ onClick, isLoading, className }: LocationFABProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "flex size-12 items-center justify-center rounded-full bg-white shadow-lg border border-border-subtle transition-transform active:scale-95 disabled:opacity-70",
        className,
      )}
      aria-label="현재 위치로 이동"
    >
      <LocateFixed className={cn("size-6 text-forest-700", isLoading && "animate-pulse")} />
    </button>
  );
}
