import { fetchNaverGeocode } from "./naver-geocoding";
import type { ApiResponse, GeocodingResult } from "@/types";

type RuntimeEnv = {
  NAVER_MAPS_CLIENT_ID?: string;
  VITE_NAVER_MAPS_CLIENT_ID?: string;
  NAVER_MAPS_CLIENT_SECRET?: string;
  VITE_NAVER_MAPS_CLIENT_SECRET?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "public, max-age=86400",
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
      runtimeEnv.VITE_NAVER_MAPS_CLIENT_SECRET ??
      process.env.NAVER_MAPS_CLIENT_SECRET ??
      process.env.VITE_NAVER_MAPS_CLIENT_SECRET ??
      "",
  };
}

export async function handleNaverGeocodeApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim();
  const { clientId, clientSecret } = readCredentials(env);

  if (!query) {
    return jsonResponse<GeocodingResult>(
      {
        success: false,
        data: null,
        error: "query is required.",
      },
      400,
    );
  }

  if (!clientId || !clientSecret) {
    return jsonResponse<GeocodingResult>(
      {
        success: false,
        data: null,
        error: "NAVER_MAPS_CLIENT_ID and NAVER_MAPS_CLIENT_SECRET are required.",
      },
      500,
    );
  }

  try {
    const geocode = await fetchNaverGeocode({
      query,
      clientId,
      clientSecret,
      fetchImpl,
    });

    return jsonResponse<GeocodingResult>({
      success: true,
      data: geocode,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<GeocodingResult>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Naver Geocoding 요청에 실패했습니다.",
      },
      502,
    );
  }
}
