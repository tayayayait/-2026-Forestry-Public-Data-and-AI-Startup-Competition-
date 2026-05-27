import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useFacilities() {
  return useQuery({
    queryKey: ["facilities"],
    queryFn: async () => {
      const response = await apiClient.getFacilities();
      if (!response.success || !response.data) {
        throw new Error(response.error || "시설 정보를 불러오지 못했습니다.");
      }
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1시간 캐싱
  });
}
