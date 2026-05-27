import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useFacilities } from "@/hooks/useFacilities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/stores/appStore";
import { useForestTrails } from "@/hooks/useForestTrails";

import { matchesRegion } from "@/lib/regions";
import {
  getCurationMapFilter,
  matchesCurationMapFilter,
  matchesFacilityText,
} from "@/lib/curation-map-filters";
import { shouldAutoRequestLocation } from "@/lib/auto-geolocation";
import { getNearbyFacilities } from "@/lib/nearby-facilities";
import { NaverMap } from "@/components/forest/Map/NaverMap";
import { SearchBar } from "@/components/forest/Map/SearchBar";
import { FilterChips } from "@/components/forest/Map/FilterChips";
import { BottomSheet } from "@/components/forest/Map/BottomSheet";
import { LocationFAB } from "@/components/forest/Map/LocationFAB";
import { MapOverlay } from "@/components/forest/Map/MapOverlay";
import { Loader2 } from "lucide-react";
import type { FacilityType } from "@/types";

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>) => ({
    curation: readStringSearch(search.curation),
    filter: readFacilityTypeSearch(search.filter),
    region: readStringSearch(search.region),
    q: readStringSearch(search.q),
  }),
  component: MapPage,
});

const FACILITY_TYPES = new Set<FacilityType | "all">([
  "all",
  "recreation_forest",
  "healing_forest",
  "arboretum",
  "education",
]);

const emptyMapSearch = { curation: null, filter: null, region: null, q: null };

function readStringSearch(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readFacilityTypeSearch(value: unknown): FacilityType | "all" | null {
  if (typeof value !== "string") return null;
  return FACILITY_TYPES.has(value as FacilityType | "all") ? (value as FacilityType | "all") : null;
}

function MapPage() {
  const { data: facilities = [], isLoading: isFacilitiesLoading } = useFacilities();
  const { data: forestTrailGeometries = [] } = useForestTrails();
  const { requestLocation } = useGeolocation();
  const mapSearch = Route.useSearch();
  const curationSummary = React.useMemo(
    () => getCurationMapFilter(mapSearch.curation),
    [mapSearch.curation],
  );

  const [searchQuery, setSearchQuery] = React.useState(mapSearch.q ?? "");
  const [activeFilter, setActiveFilter] = React.useState(
    mapSearch.filter ?? curationSummary?.defaultFacilityType ?? "all",
  );
  const [activeRegion, setActiveRegion] = React.useState(mapSearch.region ?? "all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const locationCoords = useAppStore((s) => s.location.coords);
  const locationStatus = useAppStore((s) => s.location.status);
  const locationPermission = useAppStore((s) => s.location.permission);

  React.useEffect(() => {
    setSearchQuery(mapSearch.q ?? "");
    setActiveFilter(mapSearch.filter ?? curationSummary?.defaultFacilityType ?? "all");
    setActiveRegion(mapSearch.region ?? "all");
    setSelectedId(null);
  }, [curationSummary, mapSearch.filter, mapSearch.q, mapSearch.region]);

  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const handleMapClick = React.useCallback(() => setSelectedId(null), []);

  React.useEffect(() => {
    if (
      shouldAutoRequestLocation({
        coords: locationCoords,
        status: locationStatus,
        permission: locationPermission,
      })
    ) {
      requestLocation();
    }
  }, [locationCoords, locationPermission, locationStatus, requestLocation]);

  // 필터링 및 검색 적용
  const filteredFacilities = React.useMemo(() => {
    const matchedFacilities = facilities.filter((f) => {
      const matchFilter = activeFilter === "all" || f.type === activeFilter;
      const matchRegion = matchesRegion(f.address, activeRegion);
      const matchSearch = matchesFacilityText(f, deferredSearchQuery);
      const matchCuration = !curationSummary || matchesCurationMapFilter(f, curationSummary.id);
      return matchFilter && matchRegion && matchSearch && matchCuration;
    });
    let result = getNearbyFacilities(matchedFacilities, locationCoords);
    if (curationSummary?.limit) {
      result = result.slice(0, curationSummary.limit);
    }
    return result;
  }, [
    facilities,
    activeFilter,
    activeRegion,
    deferredSearchQuery,
    curationSummary,
    locationCoords,
  ]);

  const selectedFacility = React.useMemo(
    () => facilities.find((f) => f.id === selectedId),
    [facilities, selectedId],
  );

  return (
    <div className="relative h-[calc(100vh-60px-56px)] w-full overflow-hidden lg:h-[calc(100vh-64px)]">
      {/* 1. Map Canvas (Background) */}
      <div className="absolute inset-0 z-0">
        <NaverMap
          facilities={filteredFacilities}
          trailGeometries={forestTrailGeometries}
          center={locationCoords}
          selectedFacilityId={selectedId}
          onMarkerClick={setSelectedId}
          onMapClick={handleMapClick}
        />
      </div>

      {/* 2. Top UI (Search & Filters) */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={() => {
              /* 검색 로직 */
            }}
          />
          <FilterChips
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            activeRegion={activeRegion}
            onChangeRegion={setActiveRegion}
          />


        </div>
      </div>

      {/* 3. Overlay & FAB */}
      <div className="absolute bottom-24 right-4 z-10 pointer-events-auto lg:bottom-10">
        <LocationFAB onClick={requestLocation} isLoading={locationStatus === "loading"} />
      </div>

      {selectedFacility && <MapOverlay facility={selectedFacility} onClose={handleMapClick} />}

      {/* 4. Bottom Sheet List (Mobile only, shown when no marker is selected) */}
      {!selectedId && (
        <BottomSheet facilities={filteredFacilities} onSelectFacility={setSelectedId} />
      )}

      {/* Loading Overlay */}
      {isFacilitiesLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-forest-700" />
        </div>
      )}
    </div>
  );
}
