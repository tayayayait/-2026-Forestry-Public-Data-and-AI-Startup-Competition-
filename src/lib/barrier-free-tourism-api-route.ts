import {
  fetchBarrierFreeTourAccessibility,
  type BarrierFreeTourAccessibility,
} from "./barrier-free-tourism";
import type { ApiResponse } from "@/types";

type RuntimeEnv = {
  BARRIER_FREE_TOUR_SERVICE_KEY?: string;
  VITE_BARRIER_FREE_TOUR_SERVICE_KEY?: string;
  TOUR_API_SERVICE_KEY?: string;
  VITE_TOUR_API_SERVICE_KEY?: string;
  TOURISM_SERVICE_KEY?: string;
  VITE_TOURISM_SERVICE_KEY?: string;
  PUBLIC_DATA_SERVICE_KEY?: string;
  VITE_PUBLIC_DATA_SERVICE_KEY?: string;
  KMA_SERVICE_KEY?: string;
  VITE_KMA_SERVICE_KEY?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "public, max-age=21600",
    },
  });
}

function readServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.BARRIER_FREE_TOUR_SERVICE_KEY ??
    runtimeEnv.VITE_BARRIER_FREE_TOUR_SERVICE_KEY ??
    runtimeEnv.TOUR_API_SERVICE_KEY ??
    runtimeEnv.VITE_TOUR_API_SERVICE_KEY ??
    runtimeEnv.TOURISM_SERVICE_KEY ??
    runtimeEnv.VITE_TOURISM_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
    process.env.BARRIER_FREE_TOUR_SERVICE_KEY ??
    process.env.VITE_BARRIER_FREE_TOUR_SERVICE_KEY ??
    process.env.TOUR_API_SERVICE_KEY ??
    process.env.VITE_TOUR_API_SERVICE_KEY ??
    process.env.TOURISM_SERVICE_KEY ??
    process.env.VITE_TOURISM_SERVICE_KEY ??
    process.env.PUBLIC_DATA_SERVICE_KEY ??
    process.env.VITE_PUBLIC_DATA_SERVICE_KEY ??
    process.env.KMA_SERVICE_KEY ??
    process.env.VITE_KMA_SERVICE_KEY ??
    ""
  );
}

export async function handleBarrierFreeTourismApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const contentId = url.searchParams.get("contentId")?.trim();
  const serviceKey = readServiceKey(env);

  if (!contentId) {
    return jsonResponse<BarrierFreeTourAccessibility>(
      {
        success: false,
        data: null,
        error: "contentId query parameter is required.",
      },
      400,
    );
  }

  if (!serviceKey) {
    return jsonResponse<BarrierFreeTourAccessibility>(
      {
        success: false,
        data: null,
        error:
          "BARRIER_FREE_TOUR_SERVICE_KEY, TOUR_API_SERVICE_KEY, or PUBLIC_DATA_SERVICE_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const detail = await fetchBarrierFreeTourAccessibility({
      serviceKey,
      contentId,
      fetchImpl,
    });

    return jsonResponse<BarrierFreeTourAccessibility>({
      success: true,
      data: detail,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<BarrierFreeTourAccessibility>(
      {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to fetch barrier-free tourism data.",
      },
      502,
    );
  }
}
