import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores/appStore";

export function useUvIndex() {
  const coords = useAppStore((s) => s.location.coords);
  const setEnvironment = useAppStore((s) => s.setEnvironment);

  return useQuery({
    queryKey: ["uv-index", coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) throw new Error("위치 정보가 없습니다.");
      const response = await apiClient.getUvIndex(coords.lat, coords.lng);
      if (!response.success || !response.data) {
        throw new Error(response.error || "자외선 정보를 불러오지 못했습니다.");
      }

      setEnvironment({
        uvIndex: response.data.uvIndex,
        uvLevel: response.data.uvLevel,
      });
      return response.data;
    },
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
  });
}
