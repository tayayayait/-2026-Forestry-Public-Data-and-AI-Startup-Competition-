import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";
import type { KidsForestFacilityList } from "@/lib/kids-forest";

const KIDS_FOREST_DATA_VERSION = "2026-05-26-operational-shp-only";

export function useKidsForestFacilities() {
  return useQuery({
    queryKey: ["kids-forest-facilities", KIDS_FOREST_DATA_VERSION],
    queryFn: async () => {
      const response = await fetch(
        `/api/kids-forests?datasetVersion=${KIDS_FOREST_DATA_VERSION}`,
      );
      const payload = (await response.json()) as ApiResponse<KidsForestFacilityList>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "유아숲체험원 정보를 불러오지 못했습니다.");
      }

      return payload.data;
    },
    staleTime: 6 * 60 * 60 * 1000,
  });
}
