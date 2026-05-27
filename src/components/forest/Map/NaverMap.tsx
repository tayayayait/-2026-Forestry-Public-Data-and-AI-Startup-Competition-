import * as React from "react";
import { MapPinOff } from "lucide-react";
import type { FacilityInfo, ForestTrailGeometry } from "@/types";
import {
  loadNaverMapsScript,
  readNaverMapsClientId,
  type NaverMapInstance,
  type NaverMapsNamespace,
  type NaverOverlayInstance,
} from "@/lib/naver-maps";
import { createLatLngProjector } from "@/lib/map-projection";
import { getFacilityCategoryStyle } from "@/lib/facility-category-style";
import { FacilityMarker } from "./FacilityMarker";

interface NaverMapProps {
  facilities: FacilityInfo[];
  trailGeometries?: ForestTrailGeometry[];
  center: { lat: number; lng: number } | null;
  selectedFacilityId: string | null;
  onMarkerClick: (id: string) => void;
  onMapClick: () => void;
}

type MapLoadStatus = "idle" | "loading" | "ready" | "missing-key" | "error";

const DEFAULT_CENTER = { lat: 36.5, lng: 127.8 };

function isValidLatLng(point: { lat?: number; lng?: number } | null | undefined): point is {
  lat: number;
  lng: number;
} {
  const lat = point?.lat;
  const lng = point?.lng;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function getInitialCenter(
  facilities: FacilityInfo[],
  userCenter: { lat: number; lng: number } | null,
): { lat: number; lng: number } {
  if (isValidLatLng(userCenter)) return userCenter;
  const validFacilities = facilities.filter(isValidLatLng);
  if (validFacilities.length === 0) return DEFAULT_CENTER;

  return {
    lat: validFacilities.reduce((sum, facility) => sum + facility.lat, 0) / validFacilities.length,
    lng: validFacilities.reduce((sum, facility) => sum + facility.lng, 0) / validFacilities.length,
  };
}

function markerColor(type: FacilityInfo["type"]): string {
  return getFacilityCategoryStyle(type).marker;
}

function markerContent(facility: FacilityInfo, isActive: boolean): string {
  const size = isActive ? 42 : 34;
  const style = getFacilityCategoryStyle(facility.type);
  const color = markerColor(facility.type);
  const borderWidth = isActive ? 4 : 3;
  return `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px 9999px 9999px 4px;
      transform:rotate(-45deg);
      background:${color};
      border:${borderWidth}px solid white;
      box-shadow:0 8px 18px ${style.shadow};
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        width:${Math.max(10, size - 20)}px;
        height:${Math.max(10, size - 20)}px;
        border-radius:9999px;
        background:white;
        opacity:0.95;
      "></div>
    </div>
  `;
}

function addTrailPolylines({
  maps,
  map,
  trailGeometries,
}: {
  maps: NaverMapsNamespace;
  map: NaverMapInstance;
  trailGeometries: ForestTrailGeometry[];
}): NaverOverlayInstance[] {
  return trailGeometries.flatMap((geometry) =>
    geometry.paths
      .filter((path) => path.length > 1)
      .map(
        (path) =>
          new maps.Polyline({
            map,
            path: path.map((point) => new maps.LatLng(point.lat, point.lng)),
            strokeColor: geometry.color,
            strokeWeight: 4,
            strokeOpacity: 0.72,
            strokeLineCap: "round",
            strokeLineJoin: "round",
          }),
      ),
  );
}

function safeDetachOverlay(overlay: NaverOverlayInstance): void {
  try {
    overlay.setMap?.(null);
  } catch {
    //
  }
}

function safeDestroyMap(map: NaverMapInstance | null): void {
  try {
    map?.destroy?.();
  } catch {
    //
  }
}

function createNaverLatLng(
  maps: NaverMapsNamespace,
  point: { lat: number; lng: number },
): unknown | null {
  try {
    return new maps.LatLng(point.lat, point.lng);
  } catch {
    return null;
  }
}

export function moveMapToCenter(
  map: NaverMapInstance,
  maps: NaverMapsNamespace,
  center: { lat: number; lng: number },
): boolean {
  if (!isValidLatLng(center) || !map.setCenter) return false;

  const position = createNaverLatLng(maps, center);
  if (!position) return false;

  map.setCenter(position);
  return true;
}

function FallbackMap({
  facilities,
  trailGeometries,
  center,
  selectedFacilityId,
  onMarkerClick,
  onMapClick,
  status,
}: NaverMapProps & { status: MapLoadStatus }) {
  const trailPoints = React.useMemo(
    () => trailGeometries?.flatMap((geometry) => geometry.paths.flatMap((path) => path)) ?? [],
    [trailGeometries],
  );
  const projectionPoints = React.useMemo(
    () => [...facilities, ...trailPoints],
    [facilities, trailPoints],
  );
  const project = React.useMemo(() => createLatLngProjector(projectionPoints), [projectionPoints]);
  const projectedTrailPaths = React.useMemo(
    () =>
      (trailGeometries ?? []).flatMap((geometry) =>
        geometry.paths.map((path, pathIndex) => ({
          id: `${geometry.systemId}-${pathIndex}`,
          color: geometry.color,
          systemName: geometry.systemName,
          points: path
            .map((point) => {
              const { top, left } = project(point);
              return `${left},${top}`;
            })
            .join(" "),
        })),
      ),
    [project, trailGeometries],
  );
  const statusText =
    status === "missing-key"
      ? "Naver Maps Client ID 설정 필요"
      : status === "error"
        ? "Naver Maps SDK 로딩 실패"
        : "Naver Maps 로딩 중";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E5E3DF]" onClick={onMapClick}>
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {projectedTrailPaths.length > 0 && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {projectedTrailPaths.map((trail) => (
            <polyline
              key={trail.id}
              points={trail.points}
              fill="none"
              stroke={trail.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.25}
              opacity={0.75}
              vectorEffect="non-scaling-stroke"
            >
              <title>{trail.systemName}</title>
            </polyline>
          ))}
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-text-tertiary opacity-60">
        <MapPinOff className="mb-2 size-12" />
        <p className="text-sm font-semibold">{statusText}</p>
        <p className="text-xs">임시 지도 레이어를 표시합니다</p>
      </div>
      <div className="pointer-events-none absolute inset-0">
        {facilities.map((facility) => {
          const { top, left } = project(facility);
          const isActive = facility.id === selectedFacilityId;
          return (
            <div
              key={facility.id}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ top: `${top}%`, left: `${left}%`, zIndex: isActive ? 10 : 1 }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerClick(facility.id);
              }}
            >
              <FacilityMarker type={facility.type} isActive={isActive} />
            </div>
          );
        })}
      </div>
      {center && (
        <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
          <div className="size-4 animate-pulse rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]" />
        </div>
      )}
    </div>
  );
}

export function NaverMap({
  facilities,
  trailGeometries = [],
  center,
  selectedFacilityId,
  onMarkerClick,
  onMapClick,
}: NaverMapProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<MapLoadStatus>("idle");
  const clientId = readNaverMapsClientId();

  const mapInstanceRef = React.useRef<NaverMapInstance | null>(null);
  const mapsSdkRef = React.useRef<NaverMapsNamespace | null>(null);

  const markersRef = React.useRef<NaverOverlayInstance[]>([]);
  const staticOverlaysRef = React.useRef<NaverOverlayInstance[]>([]);

  // 1. Initialize Map exactly once
  React.useEffect(() => {
    if (!clientId) {
      setStatus("missing-key");
      return;
    }
    const container = mapRef.current;
    if (!container) return;

    let disposed = false;
    setStatus("loading");

    loadNaverMapsScript(clientId)
      .then((maps) => {
        if (disposed) return;
        try {
          mapsSdkRef.current = maps;

          const initialCenter = getInitialCenter(facilities, center);
          const mapCenter = createNaverLatLng(maps, initialCenter);
          if (!mapCenter) {
            mapsSdkRef.current = null;
            setStatus("error");
            return;
          }

          const map = new maps.Map(container, {
            center: mapCenter,
            zoom: 7,
            minZoom: 6,
            mapTypeId: maps.MapTypeId?.NORMAL,
            scaleControl: true,
            logoControl: true,
            mapDataControl: false,
            zoomControl: true,
          });
          mapInstanceRef.current = map;

          maps.Event.addListener(map, "click", onMapClick);

          setStatus("ready");
        } catch {
          mapsSdkRef.current = null;
          safeDestroyMap(mapInstanceRef.current);
          mapInstanceRef.current = null;
          setStatus("error");
        }
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      markersRef.current.forEach(safeDetachOverlay);
      staticOverlaysRef.current.forEach(safeDetachOverlay);
      safeDestroyMap(mapInstanceRef.current);
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]); // Only run on mount or clientId change

  // 2. Update facility markers
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const maps = mapsSdkRef.current;
    if (!map || !maps || status !== "ready") return;

    // Detach old markers
    markersRef.current.forEach(safeDetachOverlay);
    const newMarkers: NaverOverlayInstance[] = [];

    try {
      facilities.filter(isValidLatLng).forEach((facility) => {
        const position = createNaverLatLng(maps, facility);
        if (!position) return;

        const isActive = facility.id === selectedFacilityId;
        const markerSize = isActive ? 42 : 34;

        const marker = new maps.Marker({
          map,
          position,
          title: facility.name,
          icon: {
            content: markerContent(facility, isActive),
            size: new maps.Size(markerSize, markerSize),
            anchor: new maps.Point(markerSize / 2, markerSize),
          },
          zIndex: isActive ? 100 : 10,
        });

        maps.Event.addListener(marker, "click", () => onMarkerClick(facility.id));
        newMarkers.push(marker);
      });

      markersRef.current = newMarkers;
    } catch {
      newMarkers.forEach(safeDetachOverlay);
      setStatus("error");
    }
  }, [facilities, selectedFacilityId, status, onMarkerClick]);

  // 3. Update center when user location changes
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const maps = mapsSdkRef.current;
    if (!map || !maps || status !== "ready" || !center || !isValidLatLng(center)) return;

    staticOverlaysRef.current.forEach(safeDetachOverlay);
    staticOverlaysRef.current = [];

    try {
      const position = createNaverLatLng(maps, center);
      if (!position) {
        setStatus("error");
        return;
      }

      if (!moveMapToCenter(map, maps, center)) {
        setStatus("error");
        return;
      }

      const userMarker = new maps.Marker({
        map,
        position,
        title: "현재 위치",
        icon: {
          content:
            '<div style="width:16px;height:16px;border-radius:9999px;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,.2);"></div>',
          size: new maps.Size(16, 16),
          anchor: new maps.Point(8, 8),
        },
        zIndex: 200,
      });

      staticOverlaysRef.current.push(userMarker);
    } catch {
      setStatus("error");
    }
  }, [center, status]);

  // 4. Fit bounds when facilities change significantly
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const maps = mapsSdkRef.current;
    if (!map || !maps || status !== "ready") return;

    const validFacilities = facilities.filter(isValidLatLng);
    if (validFacilities.length === 0) return;

    // Only fit bounds if we have less than the full dataset
    // (To avoid auto-fitting to the whole country on every tiny change, though we might want to fit on region change)
    if (validFacilities.length > 400) return;

    try {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      validFacilities.forEach((f) => {
        minLat = Math.min(minLat, f.lat);
        maxLat = Math.max(maxLat, f.lat);
        minLng = Math.min(minLng, f.lng);
        maxLng = Math.max(maxLng, f.lng);
      });

      if (maxLat - minLat < 0.02) {
        minLat -= 0.05; maxLat += 0.05;
      }
      if (maxLng - minLng < 0.02) {
        minLng -= 0.05; maxLng += 0.05;
      }

      const bounds = new maps.LatLngBounds(
        new maps.LatLng(minLat, minLng),
        new maps.LatLng(maxLat, maxLng)
      );

      if (map.fitBounds) {
        map.fitBounds(bounds);
      }
    } catch {
      // Ignore if fitting bounds fails
    }
  }, [facilities, status]);

  // 4. Draw trail geometries
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const maps = mapsSdkRef.current;
    if (!map || !maps || status !== "ready" || trailGeometries.length === 0) return;

    staticOverlaysRef.current = staticOverlaysRef.current.filter((o) => {
      if (o instanceof maps.Polyline) {
        safeDetachOverlay(o);
        return false;
      }
      return true;
    });

    try {
      const trailOverlays = addTrailPolylines({ maps, map, trailGeometries });
      staticOverlaysRef.current.push(...trailOverlays);
    } catch {
      setStatus("error");
    }
  }, [trailGeometries, status]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E5E3DF]">
      <div
        ref={mapRef}
        className={`absolute inset-0 h-full w-full ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {status !== "ready" && (
        <FallbackMap
          facilities={facilities}
          trailGeometries={trailGeometries}
          center={center}
          selectedFacilityId={selectedFacilityId}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          status={status}
        />
      )}
    </div>
  );
}
