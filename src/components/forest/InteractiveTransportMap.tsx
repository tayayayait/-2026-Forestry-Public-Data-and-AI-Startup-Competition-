import * as React from "react";
import {
  AlertCircle,
  Car,
  Compass,
  CornerUpLeft,
  List,
  Loader2,
  Navigation2,
  Volume2,
  X,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  fetchNaverDrivingRoute as fetchDrivingRoute,
  type DrivingRouteResult,
} from "@/lib/naver-api";
import {
  loadNaverMapsScript,
  readNaverMapsClientId,
  type NaverMapInstance,
  type NaverOverlayInstance,
} from "@/lib/naver-maps";
import { useQuery } from "@tanstack/react-query";

interface InteractiveTransportMapProps {
  destination: { lat: number; lng: number; name: string };
}

export function InteractiveTransportMap({ destination }: InteractiveTransportMapProps) {
  const locationState = useAppStore((s) => s.location);
  const location = locationState.coords;
  const locationPermission = locationState.permission;
  const locationStatus = locationState.status;
  const { requestLocation } = useGeolocation();

  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<NaverMapInstance | null>(null);
  const polylineRef = React.useRef<NaverOverlayInstance | null>(null);
  const startMarkerRef = React.useRef<NaverOverlayInstance | null>(null);
  const endMarkerRef = React.useRef<NaverOverlayInstance | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);

  // 컴포넌트 마운트 시 위치 권한 확인/요청
  React.useEffect(() => {
    if (locationPermission === "prompt") {
      requestLocation();
    }
  }, [locationPermission, requestLocation]);

  // 카카오 길찾기 API 호출
  const {
    data: routeData,
    isLoading: isRouteLoading,
    error: routeError,
  } = useQuery<DrivingRouteResult | null>({
    queryKey: ["drivingRoute", location?.lat, location?.lng, destination.lat, destination.lng],
    queryFn: () => {
      if (!location) return null;
      return fetchDrivingRoute(location, destination);
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  // 지도 렌더링 및 경로 그리기
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const clientId = readNaverMapsClientId();
        if (!clientId) {
          if (isMounted) {
            setMapError("지도 서비스를 사용할 수 없습니다. 외부 지도앱에서 경로를 확인하세요.");
          }
          return;
        }

        const naverMaps = await loadNaverMapsScript(clientId);
        if (!isMounted || !mapContainerRef.current) return;

        setMapError(null);

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new naverMaps.Map(mapContainerRef.current, {
            center: new naverMaps.LatLng(destination.lat, destination.lng),
            zoom: 13,
            mapDataControl: false,
            scaleControl: false,
            mapTypeControl: false,
            logoControl: false,
          });

          // 도착지 마커 (기본 노출)
          endMarkerRef.current = new naverMaps.Marker({
            position: new naverMaps.LatLng(destination.lat, destination.lng),
            map: mapInstanceRef.current,
            icon: {
              content: `
                <div style="background-color:#EF4444;color:white;padding:4px 12px;border-radius:20px;font-weight:bold;box-shadow:0 4px 6px -1px rgb(0 0 0/0.1);">
                  도착
                </div>
              `,
              anchor: new naverMaps.Point(20, 15),
            },
          });
        }

        // 경로 데이터가 있으면 지도에 그리기
        if (routeData && routeData.path.length > 0) {
          // 기존 Polyline 제거
          if (polylineRef.current) {
            polylineRef.current.setMap?.(null);
          }
          // 기존 출발 마커 제거
          if (startMarkerRef.current) {
            startMarkerRef.current.setMap?.(null);
          }

          const pathCoords = routeData.path.map(
            (coord) => new naverMaps.LatLng(coord.lat, coord.lng),
          );

          // 새 Polyline 렌더링
          polylineRef.current = new naverMaps.Polyline({
            map: mapInstanceRef.current,
            path: pathCoords,
            strokeColor: "#03C75A",
            strokeWeight: 5,
            strokeOpacity: 0.8,
            strokeLineCap: "round",
            strokeLineJoin: "round",
          });

          // 출발지 마커
          startMarkerRef.current = new naverMaps.Marker({
            position: pathCoords[0],
            map: mapInstanceRef.current,
            icon: {
              content: `
                <div style="background-color:#3B82F6;color:white;padding:4px 12px;border-radius:20px;font-weight:bold;box-shadow:0 4px 6px -1px rgb(0 0 0/0.1);">
                  출발
                </div>
              `,
              anchor: new naverMaps.Point(20, 15),
            },
          });

          // Bounds 조절 (출발지와 도착지가 모두 보이게)
          const naverMapsAny = naverMaps as any;
          const bounds = new naverMapsAny.LatLngBounds(pathCoords[0], pathCoords[0]);
          pathCoords.forEach((coord) => bounds.extend(coord));

          const mapAny = mapInstanceRef.current as any;
          mapAny.fitBounds?.(bounds, {
            margin: { top: 40, right: 40, bottom: 40, left: 40 },
          });
        }
      } catch {
        if (isMounted) {
          setMapError("지도 서비스를 불러올 수 없습니다. 외부 지도앱에서 경로를 확인하세요.");
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [destination, routeData]);

  // 포맷팅 유틸
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  const formatFare = (fare: number) => new Intl.NumberFormat("ko-KR").format(fare) + "원";
  const formatArrivalTime = (seconds: number) =>
    new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(Date.now() + seconds * 1000));

  // 딥링크 생성 (에러/권한거부 폴백용)
  const encodedName = encodeURIComponent(destination.name);
  const naverRouteUrl = `https://map.naver.com/index.nhn?menu=route&elng=${destination.lng}&elat=${destination.lat}&etext=${encodedName}`;

  // 실시간 주행 모드 관련 상태 및 로직
  const [isNaviMode, setIsNaviMode] = React.useState(false);
  const watchIdRef = React.useRef<number | null>(null);
  const myLocationMarkerRef = React.useRef<NaverOverlayInstance | null>(null);
  const pageScrollRef = React.useRef<{
    windowX: number;
    windowY: number;
    mainScrollTop: number | null;
  }>({
    windowX: 0,
    windowY: 0,
    mainScrollTop: null,
  });
  const [nextGuide, setNextGuide] = React.useState<any>(null);
  const [distanceToNext, setDistanceToNext] = React.useState(0);
  const [currentSpeed, setCurrentSpeed] = React.useState(0);
  const activeGuide = nextGuide ?? routeData?.guides?.[0] ?? null;
  const guidanceText = activeGuide?.guidance || "경로를 따라 이동하세요";
  const guidanceDistance = distanceToNext || activeGuide?.distance || 0;
  const remainingMinutes = routeData ? Math.max(1, Math.round(routeData.duration / 60)) : 0;
  const remainingDistanceKm = routeData ? routeData.distance / 1000 : 0;

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  React.useEffect(() => {
    if (!isNaviMode) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setMap?.(null);
        myLocationMarkerRef.current = null;
      }
      // 원래 뷰로 돌아가기
      if (mapInstanceRef.current && routeData && routeData.path.length > 0) {
        const naverMaps = (window as any).naver.maps;
        if (naverMaps) {
          const bounds = new naverMaps.LatLngBounds(
            new naverMaps.LatLng(routeData.path[0].lat, routeData.path[0].lng),
            new naverMaps.LatLng(routeData.path[0].lat, routeData.path[0].lng),
          );
          routeData.path.forEach((c) => bounds.extend(new naverMaps.LatLng(c.lat, c.lng)));
          const mapAny = mapInstanceRef.current as any;
          mapAny.fitBounds?.(bounds, { margin: { top: 40, right: 40, bottom: 40, left: 40 } });
        }
      }
      setNextGuide(null);
      return;
    }

    if (!navigator.geolocation || !mapInstanceRef.current || !routeData) return;

    const naverMaps = (window as any).naver.maps;

    // 내 위치 마커 생성
    myLocationMarkerRef.current = new naverMaps.Marker({
      position: new naverMaps.LatLng(
        location?.lat || destination.lat,
        location?.lng || destination.lng,
      ),
      map: mapInstanceRef.current,
      icon: {
        content: `
          <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 48px; height: 48px; background-color: rgba(3, 199, 90, 0.2); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 20px; height: 20px; background-color: #ffffff; border: 4px solid #03C75A; border-radius: 50%; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
          <style>@keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }</style>
        `,
        anchor: new naverMaps.Point(24, 24),
      },
    });

    mapInstanceRef.current.setZoom?.(16);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const currentCoord = new naverMaps.LatLng(latitude, longitude);

        if (speed !== null) setCurrentSpeed(Math.round(speed * 3.6));

        const mapAny = mapInstanceRef.current as any;
        const markerAny = myLocationMarkerRef.current as any;
        mapAny?.panTo?.(currentCoord, { duration: 300 });
        markerAny?.setPosition?.(currentCoord);

        if (routeData.guides && routeData.guides.length > 0) {
          let closestGuide = routeData.guides[0];
          let minDist = Infinity;
          let closestIdx = 0;
          routeData.guides.forEach((g, idx) => {
            const dist = getDistance(latitude, longitude, g.lat, g.lng);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = idx;
            }
          });
          if (minDist < 50 && closestIdx < routeData.guides.length - 1) {
            closestGuide = routeData.guides[closestIdx + 1];
            minDist = getDistance(latitude, longitude, closestGuide.lat, closestGuide.lng);
          }
          setNextGuide(closestGuide);
          setDistanceToNext(Math.round(minDist));
        }
      },
      console.error,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isNaviMode, routeData, location, destination]);

  React.useEffect(() => {
    if (!isNaviMode) return;

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const mainContent = document.querySelector<HTMLElement>("#main-content");
    pageScrollRef.current = {
      windowX: window.scrollX,
      windowY: window.scrollY,
      mainScrollTop: mainContent?.scrollTop ?? null,
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      const { windowX, windowY, mainScrollTop } = pageScrollRef.current;
      window.scrollTo(windowX, windowY);
      if (mainContent && mainScrollTop !== null) {
        mainContent.scrollTop = mainScrollTop;
      }
    };
  }, [isNaviMode]);

  React.useEffect(() => {
    if (!isNaviMode) return;

    const timeout = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      const naverMaps = (window as any).naver?.maps;
      if (!naverMaps || !mapInstanceRef.current) return;

      const center = location
        ? new naverMaps.LatLng(location.lat, location.lng)
        : new naverMaps.LatLng(destination.lat, destination.lng);
      const mapAny = mapInstanceRef.current as any;
      mapAny.setCenter?.(center);
      mapAny.setZoom?.(16);
    }, 80);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [destination.lat, destination.lng, isNaviMode, location]);

  const renderFallback = (message: string) => (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-gray-50 p-6 text-center shadow-sm border border-border-default">
        <AlertCircle className="mx-auto mb-2 size-8 text-gray-400" />
        <h4 className="font-bold text-gray-900 mb-2">실시간 길찾기 불가</h4>
        <p className="text-sm text-gray-500 mb-5">{message}</p>

        <div className="flex justify-center">
          <a
            href={naverRouteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center rounded-xl bg-[#03C75A] px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
          >
            네이버 길찾기
          </a>
        </div>
      </div>
    </div>
  );

  if (locationPermission === "denied") {
    return renderFallback("위치 정보 제공이 거부되어 실시간 경로를 표시할 수 없습니다.");
  }

  if (mapError) {
    return renderFallback(mapError);
  }

  if (routeError) {
    return renderFallback("경로 데이터를 불러오는데 실패했습니다.");
  }

  return (
    <div
      className={
        isNaviMode
          ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-white"
          : "relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm"
      }
    >
      {/* 지도 영역 */}
      <div
        ref={mapContainerRef}
        className={
          isNaviMode ? "h-full min-h-dvh w-full bg-gray-100" : "h-[360px] w-full bg-gray-100"
        }
      />

      {/* 로딩 오버레이 */}
      {(locationStatus === "loading" || isRouteLoading) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-forest-700" />
        </div>
      )}

      {/* 우측 상단 플로팅 네비게이션 시작 버튼 */}
      {routeData && !isNaviMode && (
        <button
          onClick={() => setIsNaviMode(true)}
          className="absolute right-4 top-4 z-20 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-950 shadow-lg transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 active:bg-gray-100"
        >
          <Navigation2 className="size-4" fill="currentColor" />
          주행 모드
        </button>
      )}
      {routeData && isNaviMode && (
        <button
          onClick={() => setIsNaviMode(false)}
          className="absolute right-4 top-4 z-30 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 active:bg-gray-950"
        >
          <X className="size-4" />
          종료
        </button>
      )}

      {/* 실시간 안내 패널 (상단) */}
      {isNaviMode && (
        <div className="absolute left-4 right-28 top-4 z-20 flex min-h-[108px] flex-col justify-center rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 text-gray-950 shadow-xl backdrop-blur-md sm:left-6 sm:max-w-md">
          <span className="mb-2 text-4xl font-black leading-none tracking-normal text-gray-950">
            {guidanceDistance > 1000
              ? `${(guidanceDistance / 1000).toFixed(1)}km`
              : `${guidanceDistance}m`}
          </span>
          <div className="flex items-center gap-2 text-base font-extrabold text-gray-950">
            <CornerUpLeft className="size-5 shrink-0 text-gray-950" strokeWidth={3} />
            <span className="truncate">{guidanceText}</span>
          </div>
        </div>
      )}

      {routeData && isNaviMode && (
        <div className="absolute bottom-48 right-4 z-20 flex flex-col gap-3 sm:right-6">
          <button
            type="button"
            aria-label="지도 방향 재정렬"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-950 shadow-lg transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            <Compass className="size-5" />
          </button>
          <button
            type="button"
            aria-label="안내 음성"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-950 shadow-lg transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            <Volume2 className="size-5" />
          </button>
        </div>
      )}

      {/* 정보 대시보드 (하단) */}
      {routeData && !isNaviMode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl bg-white/95 p-5 shadow-lg backdrop-blur-md border border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
              <Car className="size-3.5" />
              추천 경로
            </span>
            <span className="ml-auto text-xs font-semibold text-gray-500">
              총 {(routeData.distance / 1000).toFixed(1)}km
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                {formatDuration(routeData.duration)}
              </div>
            </div>
            <div className="text-right flex flex-col gap-1">
              <div className="text-xs text-gray-500 flex justify-between gap-4">
                <span>택시</span>
                <span className="font-semibold text-gray-800">
                  {formatFare(routeData.taxiFare)}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex justify-between gap-4">
                <span>통행료</span>
                <span className="font-semibold text-gray-800">
                  {formatFare(routeData.tollFare)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 경로 탐색 실패 (103 에러 등: 산간 오지) 시 폴백 대시보드 */}
      {!routeData && !isRouteLoading && locationStatus === "success" && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl bg-white/95 p-5 shadow-lg backdrop-blur-md border border-white/50">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  차량 진입 도로를 찾을 수 없습니다
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed word-keep">
                  목적지가 산림 내부 등 차량 접근이 불가능한 구역입니다. 지도 앱을 통해 가장 가까운
                  주차장/입구까지의 경로를 확인해 보세요.
                </p>
              </div>
            </div>

            <div className="flex mt-2">
              <a
                href={naverRouteUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center rounded-lg bg-[#03C75A] px-3 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              >
                네이버지도 길찾기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 주행 모드 시 하단 간략 대시보드 */}
      {routeData && isNaviMode && (
        <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl border border-gray-200 bg-white/95 px-5 pb-6 pt-4 text-gray-950 shadow-[0_-12px_32px_rgba(15,23,42,0.16)] backdrop-blur-md">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
          <div className="grid grid-cols-[1.25fr_0.8fr_0.8fr_44px] items-center gap-3">
            <div>
              <span className="block text-xs font-bold text-gray-500">도착 예정</span>
              <span className="block text-lg font-black text-gray-950">
                {formatArrivalTime(routeData.duration)}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-black text-gray-950">{remainingMinutes}</span>
              <span className="block text-xs font-bold text-gray-500">분</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-black text-gray-950">
                {remainingDistanceKm.toFixed(1)}
              </span>
              <span className="block text-xs font-bold text-gray-500">km</span>
            </div>
            <button
              type="button"
              aria-label="경로 목록"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-950 shadow-md transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              <List className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
            <div className="min-w-0">
              <span className="block text-xs font-bold text-gray-500">목적지</span>
              <span className="block truncate text-sm font-black text-gray-950">
                {destination.name}
              </span>
            </div>
            <div className="flex shrink-0 items-baseline gap-1">
              <span className="text-2xl font-black text-gray-950">{currentSpeed}</span>
              <span className="text-xs font-bold text-gray-600">km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
