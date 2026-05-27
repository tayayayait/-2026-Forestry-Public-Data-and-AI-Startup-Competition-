import { Card } from "@/components/forest/Card";
import { Trees, MapPin, Target } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function SummaryCard() {
  const summary = useAppStore((s) => s.visitHistory.summary);

  return (
    <Card className="relative overflow-hidden border-none bg-forest-700 text-white shadow-lg">
      <div className="absolute -right-10 -top-10 opacity-10">
        <Trees className="size-40" />
      </div>

      <div className="relative p-6">
        <h2 className="text-base font-medium text-forest-100 mb-6">나의 치유 여정</h2>

        <div className="grid grid-cols-3 gap-4 divide-x divide-forest-600">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-xs text-forest-200 mb-1">
              <Trees className="size-3.5" /> 총 방문
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{summary.totalVisits}</span>
              <span className="text-sm font-medium text-forest-200">회</span>
            </div>
          </div>

          <div className="flex flex-col pl-4">
            <span className="flex items-center gap-1.5 text-xs text-forest-200 mb-1">
              <MapPin className="size-3.5" /> 방문 장소
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{summary.uniqueFacilities}</span>
              <span className="text-sm font-medium text-forest-200">곳</span>
            </div>
          </div>

          <div className="flex flex-col pl-4">
            <span className="flex items-center gap-1.5 text-xs text-forest-200 mb-1">
              <Target className="size-3.5" /> 연속 목표
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{summary.consecutiveWeeks}</span>
              <span className="text-sm font-medium text-forest-200">주</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
