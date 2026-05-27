import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MapPin, Navigation, Search, Sprout } from "lucide-react";

import { KidsForestMapOverlay } from "@/components/forest/KidsForestMapOverlay";
import { LocationFAB } from "@/components/forest/Map/LocationFAB";
import { NaverMap } from "@/components/forest/Map/NaverMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useKidsForestFacilities } from "@/hooks/useKidsForestFacilities";
import { getNearbyFacilities, withFacilityTravelEstimates } from "@/lib/nearby-facilities";
import { REGIONS, matchesRegion } from "@/lib/regions";
import { useAppStore } from "@/stores/appStore";
import type { FacilityInfo } from "@/types";

export const Route = createFileRoute("/kids-map")({
  component: KidsForestMapPage,
});

function matchesKidsForestSearch(facility: FacilityInfo, query: string): boolean {
  const tokens = query.trim().toLocaleLowerCase("ko-KR").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const text = [
    facility.name,
    facility.address,
    facility.operatingHours,
    facility.tel,
    ...(facility.educationPrograms ?? []).flatMap((program) => [
      program.period,
      program.participationMethod,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");

  return tokens.some((token) => text.includes(token));
}

const KIDS_FOREST_REGION_OPTIONS = REGIONS.filter((region) => region.id !== "all");
const DEFAULT_KIDS_FOREST_REGION = KIDS_FOREST_REGION_OPTIONS[0]?.id ?? "all";

function KidsForestMapPage() {
  const { data, isLoading, isError, error } = useKidsForestFacilities();
  const { requestLocation } = useGeolocation();
  const locationCoords = useAppStore((state) => state.location.coords);
  const locationStatus = useAppStore((state) => state.location.status);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeRegion, setActiveRegion] = React.useState<string>(DEFAULT_KIDS_FOREST_REGION);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, []);

  const facilities = data?.items ?? [];
  const visibleFacilities = React.useMemo(() => {
    let searched = facilities.filter((facility) => matchesKidsForestSearch(facility, searchQuery));
    if (activeRegion !== "all") {
      searched = searched.filter((facility) => matchesRegion(facility.address, activeRegion));
    }
    const nearby = getNearbyFacilities(searched, locationCoords);
    return withFacilityTravelEstimates(nearby, locationCoords);
  }, [facilities, locationCoords, searchQuery, activeRegion]);

  const selectedFacility =
    visibleFacilities.find((facility) => facility.id === selectedId) ??
    facilities.find((facility) => facility.id === selectedId);

  return (
    <div className="relative h-[calc(100vh-60px-56px)] w-full overflow-hidden bg-emerald-50 lg:h-[calc(100vh-64px)]">
      <div className="absolute inset-0 z-0">
        <NaverMap
          facilities={visibleFacilities}
          center={locationCoords}
          selectedFacilityId={selectedId}
          onMarkerClick={setSelectedId}
          onMapClick={() => setSelectedId(null)}
        />
      </div>

      <div className="absolute left-0 right-0 top-0 z-10 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md px-4 pt-4">
          <div className="rounded-[24px] border border-emerald-100 bg-white/95 p-3 shadow-lg shadow-emerald-900/10 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                홈
              </Link>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                <Sprout className="size-3.5 text-emerald-600" aria-hidden />
                {visibleFacilities.length}곳 표시
              </div>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedId(null);
                }}
                placeholder="유아숲체험원, 지역, 참여방법 검색"
                className="h-11 w-full rounded-full border border-slate-100 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="mt-2 flex items-center gap-2">
              <select
                value={activeRegion}
                onChange={(e) => {
                  setActiveRegion(e.target.value);
                  setSelectedId(null);
                }}
                className="h-9 w-full rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat pr-8"
              >
                {KIDS_FOREST_REGION_OPTIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-24 right-4 z-10 pointer-events-auto lg:bottom-10">
        <LocationFAB onClick={requestLocation} isLoading={locationStatus === "loading"} />
      </div>

      {selectedFacility && (
        <KidsForestMapOverlay facility={selectedFacility} onClose={() => setSelectedId(null)} />
      )}

      {!selectedFacility && !isLoading && (
        <KidsForestBottomSheet facilities={visibleFacilities} onSelectFacility={setSelectedId} />
      )}

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/85 text-center backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-emerald-700" aria-hidden />
          <p className="mt-3 text-sm font-black text-slate-700">유아숲체험원 지도를 불러오는 중</p>
        </div>
      )}

      {isError && (
        <div className="absolute inset-x-4 bottom-24 z-40 rounded-[18px] border border-rose-100 bg-white p-4 text-sm font-bold text-rose-600 shadow-xl">
          {error instanceof Error ? error.message : "유아숲체험원 정보를 불러오지 못했습니다."}
        </div>
      )}
    </div>
  );
}

function KidsForestBottomSheet({
  facilities,
  onSelectFacility,
}: {
  facilities: FacilityInfo[];
  onSelectFacility: (id: string) => void;
}) {
  return (
    <section
      aria-label="유아숲체험원 목록"
      className="absolute bottom-0 left-0 right-0 z-30 flex max-h-[min(360px,58%)] flex-col rounded-t-[22px] border-t border-emerald-100 bg-white shadow-[0_-8px_28px_rgba(15,118,110,0.12)] lg:hidden"
    >
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-emerald-100" aria-hidden />
      <div className="flex h-[42px] shrink-0 items-center justify-between px-5">
        <span className="text-sm font-black text-slate-950">
          가까운 유아숲체험원 <span className="text-emerald-700">{facilities.length}</span>곳
        </span>
      </div>

      <div className="overflow-y-auto px-4 pb-24 pt-1">
        <div className="flex flex-col gap-3">
          {facilities.slice(0, 30).map((facility) => {
            const program = facility.educationPrograms?.[0];
            return (
              <button
                key={facility.id}
                type="button"
                onClick={() => onSelectFacility(facility.id)}
                className="rounded-[16px] border border-emerald-100 bg-white p-4 text-left shadow-sm active:bg-emerald-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-slate-950">{facility.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <MapPin className="size-3 shrink-0 text-emerald-600" aria-hidden />
                      <span className="truncate">{facility.address}</span>
                    </p>
                    {program?.period && (
                      <p className="mt-2 text-[11px] font-bold text-emerald-700">
                        {program.period}
                      </p>
                    )}
                  </div>
                  {facility.distanceMinutes && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                      <Navigation className="size-3" aria-hidden />
                      {facility.distanceMinutes}분
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
