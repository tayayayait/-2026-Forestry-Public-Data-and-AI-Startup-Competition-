import { fetchForestEducationPrograms } from "./forest-education";
import type { ApiResponse, ForestEducationProgramList } from "@/types";

type RuntimeEnv = {
  FOREST_SERVICE_KEY?: string;
  VITE_FOREST_SERVICE_KEY?: string;
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

function readForestServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return (
    runtimeEnv.FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_FOREST_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
    process.env.FOREST_SERVICE_KEY ??
    process.env.VITE_FOREST_SERVICE_KEY ??
    process.env.PUBLIC_DATA_SERVICE_KEY ??
    process.env.VITE_PUBLIC_DATA_SERVICE_KEY ??
    process.env.KMA_SERVICE_KEY ??
    process.env.VITE_KMA_SERVICE_KEY ??
    ""
  );
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function handleForestEducationProgramsApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readForestServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<ForestEducationProgramList>(
      {
        success: false,
        data: null,
        error: "FOREST_SERVICE_KEY 또는 공공데이터포털 서비스키가 설정되지 않았습니다.",
      },
      500,
    );
  }

  try {
    // 레거시 파라미터 호환 + ODCloud 파라미터 지원
    const pageNo = readPositiveInteger(
      url.searchParams.get("pageNo") ?? url.searchParams.get("page") ?? undefined,
      1,
    );
    const numOfRows = readPositiveInteger(
      url.searchParams.get("numOfRows") ?? url.searchParams.get("perPage") ?? undefined,
      100,
    );

    const programs = await fetchForestEducationPrograms({
      serviceKey,
      eduType: url.searchParams.get("eduType") ?? undefined,
      searchTitl: url.searchParams.get("searchTitl") ?? undefined,
      searchCont: url.searchParams.get("searchCont") ?? undefined,
      pageNo,
      numOfRows,
      fetchImpl,
    });

    return jsonResponse<ForestEducationProgramList>({
      success: true,
      data: programs,
      cached: false,
    });
  } catch (error) {
    console.warn("산림교육프로그램 실시간 API 조회 실패:", error);

    return jsonResponse<ForestEducationProgramList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "산림교육프로그램 API 연결에 실패했습니다.",
      },
      200,
    );
  }
}
