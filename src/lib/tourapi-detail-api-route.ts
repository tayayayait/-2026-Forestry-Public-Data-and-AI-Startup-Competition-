// ──────────────────────────────────────────────────────────────
// TourAPI 상세 조회 & 키워드 검색 서버 라우트
// ──────────────────────────────────────────────────────────────

import { fetchTourFacilityDetail, searchTourKeyword } from "./tourapi-detail";
import type { ApiResponse } from "@/types";
import type { TourFacilityDetail, TourSearchResult } from "./tourapi-detail";

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
    headers: { "cache-control": "public, max-age=21600" },
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

/**
 * GET /api/tour-detail?contentId=xxx&contentTypeId=25
 * 시설의 TourAPI 상세 정보를 통합 조회합니다.
 */
export async function handleTourDetailApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);
  const contentId = url.searchParams.get("contentId");
  const contentTypeId = url.searchParams.get("contentTypeId") ?? undefined;

  if (!contentId) {
    return jsonResponse<TourFacilityDetail>(
      { success: false, data: null, error: "contentId 파라미터가 필요합니다." },
      400,
    );
  }

  if (!serviceKey) {
    return jsonResponse<TourFacilityDetail>(
      { success: false, data: null, error: "API 서비스 키가 설정되지 않았습니다." },
      500,
    );
  }

  try {
    const detail = await fetchTourFacilityDetail({
      serviceKey,
      contentId,
      contentTypeId,
      fetchImpl,
    });

    return jsonResponse<TourFacilityDetail>({
      success: true,
      data: detail,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<TourFacilityDetail>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "TourAPI 상세 조회 실패",
      },
      502,
    );
  }
}

/**
 * GET /api/tour-search?keyword=xxx&contentTypeId=25
 * 키워드로 관광지를 검색합니다. (시설-관광지 매칭용)
 */
export async function handleTourSearchApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);
  const keyword = url.searchParams.get("keyword");
  const contentTypeId = url.searchParams.get("contentTypeId") ?? undefined;

  if (!keyword) {
    return jsonResponse<TourSearchResult[]>(
      { success: false, data: null, error: "keyword 파라미터가 필요합니다." },
      400,
    );
  }

  if (!serviceKey) {
    return jsonResponse<TourSearchResult[]>(
      { success: false, data: null, error: "API 서비스 키가 설정되지 않았습니다." },
      500,
    );
  }

  try {
    const results = await searchTourKeyword({
      serviceKey,
      keyword,
      contentTypeId,
      fetchImpl,
    });

    return jsonResponse<TourSearchResult[]>({
      success: true,
      data: results,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<TourSearchResult[]>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "TourAPI 검색 실패",
      },
      502,
    );
  }
}
