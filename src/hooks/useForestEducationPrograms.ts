import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type ForestEducationProgramSearch = {
  searchFacilityName?: string;
  pageNo?: number;
  numOfRows?: number;
  enabled?: boolean;
};

const PROGRAM_SEARCH_TIMEOUT_MS = 12000;

export function useForestEducationPrograms({
  searchFacilityName,
  pageNo = 1,
  numOfRows = 100, // ODCloud 데이터 필터링을 위해 크게 요청
  enabled = true,
}: ForestEducationProgramSearch = {}) {
  const normalizedFacilityName = searchFacilityName?.trim() ?? "";

  return useQuery({
    queryKey: ["forest-education-programs", normalizedFacilityName, pageNo, numOfRows],
    enabled,
    queryFn: async () => {
      const response = await apiClient.getForestEducationPrograms(
        {
          searchFacilityName: normalizedFacilityName || undefined,
          pageNo,
          numOfRows,
        },
        { timeoutMs: PROGRAM_SEARCH_TIMEOUT_MS },
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || "산림교육프로그램 정보를 불러오지 못했습니다.");
      }

      // 프론트엔드에서 시설명 기반으로 필터링
      const items = response.data.items;
      if (normalizedFacilityName) {
        const filteredItems = items.filter(
          (item) => item.facilityName && item.facilityName.includes(normalizedFacilityName),
        );
        return {
          ...response.data,
          items: filteredItems,
        };
      }

      return response.data;
    },
    retry: false,
    staleTime: 6 * 60 * 60 * 1000,
  });
}
