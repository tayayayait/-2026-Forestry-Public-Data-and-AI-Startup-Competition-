import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { getFacilityCategoryStyle } from "@/lib/facility-category-style";
import type { FacilityInfo } from "@/types";

interface BottomSheetProps {
  facilities: FacilityInfo[];
  onSelectFacility: (id: string) => void;
}

export const BottomSheet = React.memo(function BottomSheet({
  facilities,
  onSelectFacility,
}: BottomSheetProps) {
  return (
    <section
      aria-label="주변 치유 시설 목록"
      className="absolute bottom-0 left-0 right-0 z-30 flex max-h-[min(400px,72%)] flex-col rounded-t-[20px] border-t border-border-subtle bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.05)] lg:hidden"
    >
      <h2 className="sr-only">주변 치유 시설 목록</h2>
      <p className="sr-only">지도에 표시된 치유 시설 목록입니다.</p>
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border-default" aria-hidden />

      <div className="flex h-[40px] shrink-0 items-center px-5">
        <span className="text-sm font-bold text-text-primary">
          주변 치유 시설 <span className="text-forest-700">{facilities.length}</span>곳
        </span>
      </div>

      <div className="overflow-y-auto px-4 pb-24 pt-2">
        <div className="flex flex-col gap-3">
          {facilities.map((facility) => {
            const categoryStyle = getFacilityCategoryStyle(facility.type);

            let displayPrograms = facility.programs;
            if (facility.type === "healing_forest" || facility.type === "arboretum") {
              displayPrograms = displayPrograms.filter(
                (p) => !p.includes("숙박") && !p.includes("야영") && !p.includes("캠핑"),
              );
            } else if (facility.type === "recreation_forest") {
              // 자연휴양림은 숙박, 체험, 야영 등을 우선 배치
              const priorityKeywords = ["체험", "숙박", "야영", "캠핑"];
              displayPrograms = [...displayPrograms].sort((a, b) => {
                const aHasPriority = priorityKeywords.some((k) => a.includes(k));
                const bHasPriority = priorityKeywords.some((k) => b.includes(k));
                return aHasPriority === bHasPriority ? 0 : aHasPriority ? -1 : 1;
              });
            }

            return (
              <button
                key={facility.id}
                onClick={() => onSelectFacility(facility.id)}
                className="flex flex-col rounded-xl border border-border-subtle bg-white p-4 text-left shadow-sm active:bg-warm-bg [contain-intrinsic-size:96px] [content-visibility:auto]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: categoryStyle.marker }}
                        aria-hidden
                      />
                      <span className="text-[10px] font-bold" style={{ color: categoryStyle.text }}>
                        {categoryStyle.label}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">{facility.name}</h4>
                    <p className="mt-1 flex items-center text-[11px] text-text-secondary">
                      <MapPin className="mr-1 size-3" />
                      {facility.address.split(" ").slice(0, 2).join(" ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {facility.distanceMinutes && (
                      <span className="flex flex-col items-center justify-center rounded-lg bg-forest-50 px-2 py-1.5 text-xs font-bold text-forest-700">
                        <Navigation className="mb-0.5 size-3" />
                        {facility.distanceMinutes}분
                      </span>
                    )}
                    {facility.educationPrograms && facility.educationPrograms.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-coral/10 px-1.5 py-0.5 text-[10px] font-bold text-coral">
                        프로그램 {facility.educationPrograms.length}건
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {displayPrograms.slice(0, 2).map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-warm-bg px-1.5 py-0.5 text-[10px] text-text-tertiary"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});
