import { fetchTraditionalVillageForests } from "./traditional-village-forest";
import type { ApiResponse, TraditionalVillageForestList } from "@/types";

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

function readServiceKey(env: unknown): string {
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

function readOptionalSearchParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value == null || value === "" ? undefined : value;
}

export async function handleTraditionalVillageForestsApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<TraditionalVillageForestList>(
      {
        success: false,
        data: null,
        error: "FOREST_SERVICE_KEY or PUBLIC_DATA_SERVICE_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const forests = await fetchTraditionalVillageForests({
      serviceKey,
      searchVllgNm: readOptionalSearchParam(url, "searchVllgNm"),
      searchPlcNm: readOptionalSearchParam(url, "searchPlcNm"),
      pageNo: readOptionalSearchParam(url, "pageNo") ?? 1,
      numOfRows: readOptionalSearchParam(url, "numOfRows") ?? 10,
      fetchImpl,
    });

    return jsonResponse<TraditionalVillageForestList>({
      success: true,
      data: forests,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<TraditionalVillageForestList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "전통마을숲 정보를 조회하지 못했습니다.",
      },
      502,
    );
  }
}
