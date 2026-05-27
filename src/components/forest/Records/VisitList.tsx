import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import type { VisitRecord } from "@/types";

export function VisitList() {
  const records = useAppStore((s) => s.visitHistory.records);

  if (records.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-border-default bg-white mt-4">
        <p className="text-sm font-medium text-text-tertiary">아직 방문 기록이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-base font-bold text-text-primary">최근 방문 기록</h3>
      </div>

      {records.map((record: VisitRecord) => (
        <button
          key={record.id}
          className="w-full flex items-center justify-between rounded-xl border border-border-subtle bg-white p-4 shadow-sm transition-colors active:bg-warm-bg text-left"
        >
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[15px] font-bold text-text-primary">{record.facilityName}</h4>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {record.visitDate.toISOString().split("T")[0]}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                스트레스 감소: {record.preStress - record.postStress}
              </span>
            </div>
          </div>
          <ChevronRight className="size-5 text-text-tertiary" />
        </button>
      ))}
    </div>
  );
}
