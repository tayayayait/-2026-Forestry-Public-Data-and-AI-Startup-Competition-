import { fetchNearbyTourismPlaces } from "./tourapi";
import { enrichNearbyPlacesWithBarrierFreeAccessibility } from "./barrier-free-tourism";
import type { ApiResponse, NearbyPlace } from "@/types";

type RuntimeEnv = {
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
    runtimeEnv.TOUR_API_SERVICE_KEY ??
    runtimeEnv.VITE_TOUR_API_SERVICE_KEY ??
    runtimeEnv.TOURISM_SERVICE_KEY ??
    runtimeEnv.VITE_TOURISM_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
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

function parseNumber(value: string | null): number | null {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | null, fallback: number): number {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function handleTourismApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);
  const lat = parseNumber(url.searchParams.get("lat"));
  const lng = parseNumber(url.searchParams.get("lng"));
  const radius = Math.min(parseInteger(url.searchParams.get("radius"), 20_000), 20_000);
  const numOfRows = parseInteger(url.searchParams.get("numOfRows"), 10);
  const limit = parseInteger(url.searchParams.get("limit"), 8);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat == null || lng == null) {
    return jsonResponse<NearbyPlace[]>(
      {
        success: false,
        data: null,
        error: "lat and lng query parameters are required.",
      },
      400,
    );
  }

  if (!serviceKey) {
    return jsonResponse<NearbyPlace[]>(
      {
        success: false,
        data: null,
        error: "TOUR_API_SERVICE_KEY or PUBLIC_DATA_SERVICE_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const places = await fetchNearbyTourismPlaces({
      serviceKey,
      lat,
      lng,
      radius,
      numOfRows,
      limit,
      fetchImpl,
    });
    const enrichedPlaces = await enrichNearbyPlacesWithBarrierFreeAccessibility(places, {
      serviceKey,
      fetchImpl,
    });

    return jsonResponse<NearbyPlace[]>({
      success: true,
      data: enrichedPlaces,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<NearbyPlace[]>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch TourAPI data.",
      },
      502,
    );
  }
}
