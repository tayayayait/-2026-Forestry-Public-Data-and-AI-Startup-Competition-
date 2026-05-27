import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/regions";
import { MAP_LEGEND_FACILITY_TYPES, getFacilityCategoryStyle } from "@/lib/facility-category-style";
import type { FacilityType } from "@/types";

type FacilityFilter = FacilityType | "all";

const FILTERS: Array<{ id: FacilityFilter }> = [
  { id: "all" },
  { id: "healing_forest" },
  { id: "recreation_forest" },
  { id: "arboretum" },
];

interface FilterChipsProps {
  activeFilter: FacilityFilter;
  onChangeFilter: (filter: FacilityFilter) => void;
  activeRegion: string;
  onChangeRegion: (region: string) => void;
}

export function FilterChips({
  activeFilter,
  onChangeFilter,
  activeRegion,
  onChangeRegion,
}: FilterChipsProps) {
  return (
    <div className="w-full px-4 pb-2">
      <div className="flex flex-col gap-2">
        {/* 지역 선택 드롭다운 */}
        <div className="flex items-center gap-2">
          <select
            value={activeRegion}
            onChange={(e) => onChangeRegion(e.target.value)}
            className="rounded-full border border-border-default bg-white px-3 py-1.5 text-sm font-semibold text-text-primary shadow-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500"
          >
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* 시설 유형 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((filter) => {
            const style = getFacilityCategoryStyle(filter.id);
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onChangeFilter(filter.id)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors",
                  isActive ? "text-white" : "bg-white hover:bg-white/95",
                )}
                style={{
                  backgroundColor: isActive ? style.marker : "white",
                  borderColor: isActive ? style.markerBorder : style.softBorder,
                  color: isActive ? "white" : style.text,
                }}
                aria-label={`${style.label} ${style.colorName}`}
              >
                <span
                  className="size-2.5 rounded-full border border-white/70"
                  style={{ backgroundColor: isActive ? "white" : style.marker }}
                  aria-hidden
                />
                {style.label}
              </button>
            );
          })}
        </div>

        <div className="mx-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-text-secondary shadow-sm">
          <span className="text-text-tertiary">범례</span>
          {MAP_LEGEND_FACILITY_TYPES.map((type) => {
            const style = getFacilityCategoryStyle(type);

            return (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: style.marker }}
                  aria-hidden
                />
                <span style={{ color: style.text }}>{style.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
