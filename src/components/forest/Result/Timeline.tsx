import { cn } from "@/lib/utils";
import type { ScheduleItem } from "@/types";
import { Clock, MapPin } from "lucide-react";

interface TimelineProps {
  schedule: ScheduleItem[];
  className?: string;
}

export function Timeline({ schedule, className }: TimelineProps) {
  return (
    <div
      className={cn(
        "relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-border-default",
        className,
      )}
    >
      {schedule.map((item, index) => (
        <div key={index} className="relative flex items-start gap-4">
          <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-50 border-2 border-forest-700 shadow-sm">
            <span className="text-sm font-bold text-forest-700">{index + 1}</span>
          </div>

          <div className="flex flex-col pt-1.5 pb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-text-tertiary w-11">{item.time}</span>
              <h3 className="text-base font-bold text-text-primary">{item.activity}</h3>
            </div>

            <p className="mt-1 text-sm text-text-secondary">{item.description}</p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-text-tertiary">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {item.durationMinutes}분
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {item.location}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
