import type { ApiResponse } from "@/types";

import type { DrivingRouteResult } from "./naver-direction";

export type { DrivingRouteGuide, DrivingRouteResult } from "./naver-direction";

export async function fetchNaverDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<DrivingRouteResult | null> {
  const params = new URLSearchParams({
    start: `${origin.lng},${origin.lat}`,
    goal: `${destination.lng},${destination.lat}`,
  });

  try {
    const response = await fetch(`/api/naver-direction?${params.toString()}`);
    const payload = (await response
      .json()
      .catch(() => null)) as ApiResponse<DrivingRouteResult> | null;

    if (!response.ok || !payload?.success || !payload.data) {
      return null;
    }

    return payload.data;
  } catch {
    return null;
  }
}
