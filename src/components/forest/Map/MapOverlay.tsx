import { X, Navigation2, Info, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getFacilityCategoryStyle } from "@/lib/facility-category-style";
import type { FacilityInfo, TrailInfo } from "@/types";
import { useAppStore } from "@/stores/appStore";

interface MapOverlayProps {
  facility: FacilityInfo;
  onClose: () => void;
}

const difficultyLabel: Record<TrailInfo["difficulty"], string> = {
  easy: "쉬움",
  moderate: "보통",
  hard: "어려움",
};

export function MapOverlay({ facility, onClose }: MapOverlayProps) {
  const locationCoords = useAppStore((s) => s.location.coords);
  const trails = facility.trails.slice(0, 2);
  const educationPrograms = facility.educationPrograms?.slice(0, 2) || [];
  const categoryStyle = getFacilityCategoryStyle(facility.type);

  let displayPrograms = facility.programs;
  if (facility.type === "healing_forest" || facility.type === "arboretum") {
    displayPrograms = displayPrograms.filter(
      (p) => !p.includes("숙박") && !p.includes("야영") && !p.includes("캠핑")
    );
  } else if (facility.type === "recreation_forest") {
    const priorityKeywords = ["체험", "숙박", "야영", "캠핑"];
    displayPrograms = [...displayPrograms].sort((a, b) => {
      const aHasPriority = priorityKeywords.some(k => a.includes(k));
      const bHasPriority = priorityKeywords.some(k => b.includes(k));
      return aHasPriority === bHasPriority ? 0 : aHasPriority ? -1 : 1;
    });
  }

  const handleDirections = () => {
    // 네이버 지도 목적지 링크 형식: https://map.naver.com/index.nhn?menu=route&elng=경도&elat=위도&etext=이름
    const encodedName = encodeURIComponent(facility.name);
    const startParams = locationCoords
      ? `&slng=${locationCoords.lng}&slat=${locationCoords.lat}&sname=${encodeURIComponent("내 위치")}`
      : "";
    const url = `https://map.naver.com/index.nhn?menu=route${startParams}&elng=${facility.lng}&elat=${facility.lat}&etext=${encodedName}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="absolute bottom-20 left-1/2 z-20 w-[min(340px,calc(100vw-32px))] -translate-x-1/2 animate-in rounded-2xl border border-border-subtle bg-white p-5 shadow-2xl fade-in slide-in-from-bottom-4 mb-env-safe">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-text-tertiary hover:text-text-primary"
        aria-label="시설 정보 닫기"
      >
        <X className="size-4" />
      </button>

      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: categoryStyle.softBg,
            color: categoryStyle.text,
            border: `1px solid ${categoryStyle.softBorder}`,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: categoryStyle.marker }}
            aria-hidden
          />
          {categoryStyle.label}
        </span>
      </div>

      <h3 className="pr-6 text-base font-bold text-text-primary">{facility.name}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{facility.address}</p>

      {displayPrograms.length > 0 && (
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {displayPrograms.slice(0, 3).map((p) => (
            <span
              key={p}
              className="rounded-md bg-warm-bg px-1.5 py-0.5 text-[10px] text-text-tertiary"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {trails.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border-subtle pt-3">
          {trails.map((trail) => (
            <div key={trail.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-text-primary">{trail.name}</span>
              <span className="shrink-0 text-text-tertiary">
                {trail.distanceKm}km · {difficultyLabel[trail.difficulty]}
              </span>
            </div>
          ))}
        </div>
      )}

      {educationPrograms.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-forest-600" />
              <span className="text-[11px] font-bold text-forest-700">
                산림교육 프로그램 ({facility.educationPrograms?.length}건)
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {educationPrograms.map((program, idx) => (
              <div key={idx} className="flex flex-col gap-0.5 text-xs">
                <span className="truncate font-medium text-text-primary">{program.title}</span>
                <span className="truncate text-[10px] text-text-tertiary">
                  {program.period || program.category || "운영기간/분류 상세참조"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleDirections}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-forest-50 py-2.5 text-xs font-bold text-forest-700 hover:bg-forest-100"
        >
          <Navigation2 className="size-3.5" /> 길찾기
        </button>
        <Link
          to="/facilities/$facilityId"
          params={{ facilityId: facility.id }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-white py-2.5 text-xs font-bold text-text-primary hover:bg-warm-bg"
        >
          <Info className="size-3.5" /> 상세정보
        </Link>
      </div>
    </div>
  );
}
