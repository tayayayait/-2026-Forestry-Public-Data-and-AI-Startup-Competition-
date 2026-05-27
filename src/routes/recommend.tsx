import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAirQuality } from "@/hooks/useAirQuality";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRecommendation } from "@/hooks/useRecommendation";
import { useUvIndex } from "@/hooks/useUvIndex";
import { useWeather } from "@/hooks/useWeather";

export const Route = createFileRoute("/recommend")({
  component: RecommendPage,
});

function RecommendPage() {
  const { coords, requestLocation } = useGeolocation();
  const locationCoords = coords;
  const weatherQuery = useWeather(locationCoords);
  const airQualityQuery = useAirQuality(locationCoords);
  const uvIndexQuery = useUvIndex(locationCoords);
  const recommendation = useRecommendation();

  const environmentReady =
    !!locationCoords &&
    !!weatherQuery.data &&
    !!airQualityQuery.data &&
    !!uvIndexQuery.data &&
    !weatherQuery.isLoading &&
    !airQualityQuery.isLoading &&
    !uvIndexQuery.isLoading;

  const handleRecommend = () => {
    if (!environmentReady) return;
    recommendation.mutate({
      profileId: "local-health-profile",
      location: locationCoords,
      environment: {
        weather: weatherQuery.data,
        airQuality: airQualityQuery.data,
        uvIndex: uvIndexQuery.data?.uvIndex,
        uvLevel: uvIndexQuery.data?.uvLevel,
      },
    });
  };

  React.useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-bold text-text-primary">AI 산림 치유 추천</h1>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        현재 위치의 날씨, 대기질, 자외선 정보를 확인한 뒤 추천을 생성합니다.
      </p>
      <button
        type="button"
        onClick={handleRecommend}
        disabled={!environmentReady || recommendation.isPending}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-forest-700 px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        추천 생성
      </button>
    </main>
  );
}
