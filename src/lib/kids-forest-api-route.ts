import { KIDS_FOREST_COORDINATE_SEEDS } from "./kids-forest-coordinate-seeds";
import {
  buildOperationalKidsForestFacilitiesFromCoordinateSeeds,
  fetchKidsForestApiItems,
  type KidsForestFacilityList,
  type KidsForestApiItem,
} from "./kids-forest";
import type { ApiResponse } from "@/types";

type RuntimeEnv = {
  FOREST_SERVICE_KEY?: string;
  VITE_FOREST_SERVICE_KEY?: string;
  PUBLIC_DATA_SERVICE_KEY?: string;
  VITE_PUBLIC_DATA_SERVICE_KEY?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}

function readForestServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_FOREST_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    process.env.FOREST_SERVICE_KEY ??
    process.env.VITE_FOREST_SERVICE_KEY ??
    process.env.PUBLIC_DATA_SERVICE_KEY ??
    process.env.VITE_PUBLIC_DATA_SERVICE_KEY ??
    ""
  );
}

async function loadKidsForestApiItems(
  serviceKey: string,
  fetchImpl: typeof fetch,
): Promise<KidsForestApiItem[]> {
  if (!serviceKey) return [];

  try {
    const response = await fetchKidsForestApiItems({
      serviceKey,
      perPage: 1000,
      fetchImpl,
    });
    return response.data ?? [];
  } catch {
    return [];
  }
}

export async function handleKidsForestFacilitiesApiRequest(
  _request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  try {
    const serviceKey = readForestServiceKey(env);
    const apiItems = await loadKidsForestApiItems(serviceKey, fetchImpl);
    const facilities = buildOperationalKidsForestFacilitiesFromCoordinateSeeds({
      coordinateSeeds: KIDS_FOREST_COORDINATE_SEEDS,
      apiItems,
    });

    return jsonResponse<KidsForestFacilityList>({
      success: true,
      data: facilities,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<KidsForestFacilityList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to load kids forest facilities.",
      },
      502,
    );
  }
}
