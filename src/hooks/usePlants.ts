import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function usePlants(searchWrd?: string) {
  const normalizedSearch = searchWrd?.trim() ?? "";

  return useQuery({
    queryKey: ["plants", normalizedSearch],
    queryFn: async () => {
      const response = await apiClient.getPlants(normalizedSearch || undefined, {
        timeoutMs: 12000,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || "식물 정보를 불러오지 못했습니다.");
      }
      return response.data;
    },
    retry: false,
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function usePlantImages(storyId?: string) {
  const normalizedStoryId = storyId?.trim() ?? "";

  return useQuery({
    queryKey: ["plant-images", normalizedStoryId],
    enabled: normalizedStoryId.length > 0,
    queryFn: async () => {
      const response = await apiClient.getPlantImages(normalizedStoryId, {
        timeoutMs: 12000,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || "식물 이미지 정보를 불러오지 못했습니다.");
      }
      return response.data;
    },
    retry: false,
    staleTime: 6 * 60 * 60 * 1000,
  });
}
