import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient, type FacilityHomepageAnalysisInput } from "@/lib/api-client";
import {
  readCachedHomepageAnalysis,
  writeCachedHomepageAnalysis,
} from "@/lib/facility-homepage-analysis-cache";
import type { FacilityHomepageAnalysis } from "@/types";

export function useFacilityHomepageAnalysis() {
  return useMutation<FacilityHomepageAnalysis, Error, FacilityHomepageAnalysisInput>({
    mutationFn: async (input) => {
      const cachedAnalysis = readCachedHomepageAnalysis(input.homepageUrl);
      if (cachedAnalysis) return cachedAnalysis;

      const response = await apiClient.analyzeFacilityHomepage(input);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to analyze the official homepage.");
      }
      writeCachedHomepageAnalysis(response.data);
      return response.data;
    },
  });
}

export function usePinnedFacilityHomepageAnalysis(homepageUrl?: string) {
  return useQuery<FacilityHomepageAnalysis | null>({
    queryKey: ["facility-homepage-analysis", homepageUrl],
    enabled: !!homepageUrl,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!homepageUrl) return null;
      const response = await apiClient.getPinnedFacilityHomepageAnalysis(homepageUrl);
      if (!response.success || !response.data) return null;
      writeCachedHomepageAnalysis(response.data);
      return response.data;
    },
  });
}
