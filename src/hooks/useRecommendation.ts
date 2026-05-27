import { useMutation } from "@tanstack/react-query";
import { apiClient, type RecommendationEnvironmentSnapshot } from "@/lib/api-client";
import type { LatLng } from "@/lib/nearby-facilities";
import { useAppStore } from "@/stores/appStore";

type RecommendationMutationInput = {
  profileId: string;
  facilityId?: string;
  persist?: boolean;
  environment?: RecommendationEnvironmentSnapshot;
  location?: LatLng | null;
};

export function useRecommendation() {
  const setRecommendation = useAppStore((s) => s.setRecommendation);
  const setRecommendationStatus = useAppStore((s) => s.setRecommendationStatus);
  const environment = useAppStore((s) => s.environment);

  return useMutation({
    mutationFn: async ({
      profileId,
      facilityId,
      persist = true,
      environment: requestEnvironment,
      location,
    }: RecommendationMutationInput) => {
      setRecommendationStatus("loading");
      const response = await apiClient.generateRecommendation(
        profileId,
        facilityId,
        undefined,
        requestEnvironment ?? {
          weather: environment.weather,
          airQuality: environment.airQuality,
          uvIndex: environment.uvIndex,
          uvLevel: environment.uvLevel,
        },
        location,
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || "추천 생성 중 오류가 발생했습니다.");
      }

      if (!persist) return response.data;

      const savedResponse = await apiClient.saveRecommendation(response.data);
      return savedResponse.success && savedResponse.data ? savedResponse.data : response.data;
    },
    onSuccess: (data) => {
      setRecommendation(data);
    },
    onError: (error) => {
      setRecommendationStatus("error", error.message);
    },
  });
}
