import { fetchKmaUvIndex } from "./kma-living-weather";
import type { ApiResponse, UVIndexData } from "@/types";

type RuntimeEnv = {
  KMA_SERVICE_KEY?: string;
  VITE_KMA_SERVICE_KEY?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "public, max-age=3600",
    },
  });
}

function readKmaServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
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

export async function handleUvIndexApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const lat = parseCoordinate(url.searchParams.get("lat"));
  const lng = parseCoordinate(url.searchParams.get("lng"));

  if (lat == null || lng == null) {
    return jsonResponse<UVIndexData>(
      {
        success: false,
        data: null,
        error: "lat, lng 쿼리 파라미터가 필요합니다.",
      },
      400,
    );
  }

  const serviceKey = readKmaServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<UVIndexData>(
      {
        success: false,
        data: null,
        error: "KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.",
      },
      500,
    );
  }

  try {
    const uvIndex = await fetchKmaUvIndex({ lat, lng, serviceKey, fetchImpl });
    return jsonResponse<UVIndexData>({
      success: true,
      data: uvIndex,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<UVIndexData>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "기상청 자외선지수 조회에 실패했습니다.",
      },
      502,
    );
  }
}
