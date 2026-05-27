import * as React from "react";
import { MapPinOff, Loader2 } from "lucide-react";
import {
  loadNaverMapsScript,
  readNaverMapsClientId,
  type NaverMapInstance,
  type NaverMapsNamespace,
  type NaverOverlayInstance,
} from "@/lib/naver-maps";
import type { WaypointInfo } from "@/types";

interface CourseMapProps {
  waypoints: WaypointInfo[];
  facilityCenter?: { lat: number; lng: number; name?: string };
}

type MapLoadStatus = "idle" | "loading" | "ready" | "missing-key" | "error";

export function CourseMap({ waypoints, facilityCenter }: CourseMapProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState<MapLoadStatus>("idle");
  const clientId = readNaverMapsClientId();

  const mapInstanceRef = React.useRef<NaverMapInstance | null>(null);
  const mapsSdkRef = React.useRef<NaverMapsNamespace | null>(null);
  const markersRef = React.useRef<NaverOverlayInstance[]>([]);

  // 1. Initialize Map
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

          // 시설 좌표가 있으면 사용, 없으면 서울 시청 기본 좌표
          const initialLat = facilityCenter?.lat ?? 37.5666102;
          const initialLng = facilityCenter?.lng ?? 126.9783881;

          const map = new maps.Map(container, {
            center: new maps.LatLng(initialLat, initialLng),
            zoom: 14,
            minZoom: 6,
            mapTypeId: maps.MapTypeId?.NORMAL,
            scaleControl: true,
            logoControl: true,
            mapDataControl: false,
            zoomControl: true,
          });
          mapInstanceRef.current = map;

          // 시설 마커 표시
          if (facilityCenter?.lat && facilityCenter?.lng) {
            const marker = new maps.Marker({
              map,
              position: new maps.LatLng(facilityCenter.lat, facilityCenter.lng),
              title: facilityCenter.name ?? "시설 위치",
              icon: {
                content:
                  '<div style="width:16px;height:16px;border-radius:9999px;background:#2d6a4f;border:3px solid white;box-shadow:0 0 0 5px rgba(45,106,79,.2);"></div>',
                size: new maps.Size(16, 16),
                anchor: new maps.Point(8, 8),
              },
            });
            markersRef.current.push(marker);
          }

          setStatus("ready");
        } catch {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      markersRef.current.forEach((m) => m.setMap?.(null));
      mapInstanceRef.current?.destroy?.();
    };
  }, [clientId]);

  // 2. Fallback UI if map loading fails
  if (status === "error" || status === "missing-key") {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-2xl bg-forest-50 text-text-tertiary">
        <MapPinOff className="mb-2 size-8" />
        <p className="text-sm font-semibold">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
      <div
        ref={mapRef}
        className={`absolute inset-0 h-full w-full transition-opacity ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
          <Loader2 className="size-6 animate-spin text-forest-700" />
        </div>
      )}
    </div>
  );
}
