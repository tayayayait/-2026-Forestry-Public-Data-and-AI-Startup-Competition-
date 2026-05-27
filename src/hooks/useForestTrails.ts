import { useQuery } from "@tanstack/react-query";
import { getForestTrailData } from "@/lib/forest-trails";

export function useForestTrails() {
  return useQuery({
    queryKey: ["forestTrails"],
    queryFn: async () => {
      const { geometries } = await getForestTrailData(fetch);
      return geometries;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
