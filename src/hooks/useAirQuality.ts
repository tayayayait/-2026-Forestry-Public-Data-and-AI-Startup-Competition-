import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores/appStore";

export function useAirQuality() {
  const coords = useAppStore((s) => s.location.coords);
  const setEnvironment = useAppStore((s) => s.setEnvironment);

  return useQuery({
    queryKey: ["air-quality", coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) throw new Error("위치 정보가 없습니다.");
      const response = await apiClient.getAirQuality(coords.lat, coords.lng);
      if (!response.success || !response.data) {
        throw new Error(response.error || "대기질 정보를 불러오지 못했습니다.");
      }
      setEnvironment({ airQuality: response.data });
      return response.data;
    },
    enabled: !!coords,
    staleTime: 10 * 60 * 1000, // 10분
  });
}
