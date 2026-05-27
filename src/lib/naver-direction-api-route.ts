import type { ApiResponse } from "@/types";

import {
  fetchNaverDrivingRouteFromNaver,
  NaverDirectionApiError,
  type DrivingRouteResult,
} from "./naver-direction";

type RuntimeEnv = {
  NAVER_MAPS_CLIENT_ID?: string;
  VITE_NAVER_MAPS_CLIENT_ID?: string;
  NAVER_MAPS_CLIENT_SECRET?: string;
  VITE_NAVER_MAPS_CLIENT_SECRET?: string;
};

type LatLng = {
  lat: number;
  lng: number;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function readCredentials(env: unknown): { clientId: string; clientSecret: string } {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return {
    clientId:
      runtimeEnv.NAVER_MAPS_CLIENT_ID ??
      runtimeEnv.VITE_NAVER_MAPS_CLIENT_ID ??
      process.env.NAVER_MAPS_CLIENT_ID ??
      process.env.VITE_NAVER_MAPS_CLIENT_ID ??
      "",
    clientSecret:
      runtimeEnv.NAVER_MAPS_CLIENT_SECRET ??
      process.env.NAVER_MAPS_CLIENT_SECRET ??
      runtimeEnv.VITE_NAVER_MAPS_CLIENT_SECRET ??
      process.env.VITE_NAVER_MAPS_CLIENT_SECRET ??
      "",
  };
}

export function parseLngLatParam(value: string | null): LatLng | null {
  const [lngRaw, latRaw] = value?.split(",") ?? [];
  const lng = Number.parseFloat(lngRaw ?? "");
  const lat = Number.parseFloat(latRaw ?? "");

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function toUnavailableMessage(error: unknown): string {
  if (error instanceof NaverDirectionApiError && error.errorCode === "210") {
    return "Naver Directions 5 API subscription is required.";
  }

  if (error instanceof NaverDirectionApiError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "Naver Direction request failed.";
}

export async function handleNaverDirectionApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const origin = parseLngLatParam(url.searchParams.get("start"));
  const destination = parseLngLatParam(url.searchParams.get("goal"));
  const { clientId, clientSecret } = readCredentials(env);

  if (!origin || !destination) {
    return jsonResponse<DrivingRouteResult>(
      {
        success: false,
        data: null,
        error: 'start and goal are required as "lng,lat".',
      },
      400,
    );
  }

  if (!clientId || !clientSecret) {
    return jsonResponse<DrivingRouteResult>({
      success: false,
      data: null,
      error: "NAVER_MAPS_CLIENT_ID and NAVER_MAPS_CLIENT_SECRET are required.",
    });
  }

  try {
    const route = await fetchNaverDrivingRouteFromNaver({
      origin,
      destination,
      clientId,
      clientSecret,
      fetchImpl,
    });

    if (!route) {
      return jsonResponse<DrivingRouteResult>({
        success: false,
        data: null,
        error: "Naver Direction route was not found.",
      });
    }

    return jsonResponse<DrivingRouteResult>({
      success: true,
      data: route,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<DrivingRouteResult>({
      success: false,
      data: null,
      error: toUnavailableMessage(error),
    });
  }
}
