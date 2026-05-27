import { fetchAirKoreaAirQuality } from "./airkorea";
import type { AirQualityData, ApiResponse } from "@/types";

type RuntimeEnv = {
  AIRKOREA_SERVICE_KEY?: string;
  VITE_AIRKOREA_SERVICE_KEY?: string;
  PUBLIC_DATA_SERVICE_KEY?: string;
  VITE_PUBLIC_DATA_SERVICE_KEY?: string;
  KMA_SERVICE_KEY?: string;
  VITE_KMA_SERVICE_KEY?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "public, max-age=900",
    },
  });
}

function readAirKoreaServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.AIRKOREA_SERVICE_KEY ??
    runtimeEnv.VITE_AIRKOREA_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
    process.env.AIRKOREA_SERVICE_KEY ??
    process.env.VITE_AIRKOREA_SERVICE_KEY ??
    process.env.PUBLIC_DATA_SERVICE_KEY ??
    process.env.VITE_PUBLIC_DATA_SERVICE_KEY ??
    process.env.KMA_SERVICE_KEY ??
    process.env.VITE_KMA_SERVICE_KEY ??
    ""
  );
}

function parseCoordinate(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function handleAirQualityApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const lat = parseCoordinate(url.searchParams.get("lat"));
  const lng = parseCoordinate(url.searchParams.get("lng"));

  if (lat == null || lng == null) {
    return jsonResponse<AirQualityData>(
      {
        success: false,
        data: null,
        error: "lat, lng 쿼리 파라미터가 필요합니다.",
      },
      400,
    );
  }

  const serviceKey = readAirKoreaServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<AirQualityData>(
      {
        success: false,
        data: null,
        error: "AIRKOREA_SERVICE_KEY 또는 공공데이터포털 서비스키가 설정되지 않았습니다.",
      },
      500,
    );
  }

  try {
    const airQuality = await fetchAirKoreaAirQuality({ lat, lng, serviceKey, fetchImpl });
    return jsonResponse<AirQualityData>({
      success: true,
      data: airQuality,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<AirQualityData>(
      {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "에어코리아 대기질 정보를 조회하지 못했습니다.",
      },
      502,
    );
  }
}
