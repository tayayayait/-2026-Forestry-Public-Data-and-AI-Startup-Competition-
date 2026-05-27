import { fetchRecreationForests } from "./recreation-forest";
import type { ApiResponse, RecreationForestList } from "@/types";

type RuntimeEnv = {
  RECREATION_FOREST_SERVICE_KEY?: string;
  VITE_RECREATION_FOREST_SERVICE_KEY?: string;
  FOREST_SERVICE_KEY?: string;
  VITE_FOREST_SERVICE_KEY?: string;
  PUBLIC_DATA_SERVICE_KEY?: string;
  VITE_PUBLIC_DATA_SERVICE_KEY?: string;
  KMA_SERVICE_KEY?: string;
  VITE_KMA_SERVICE_KEY?: string;
};

const QUERY_PARAMS = [
  "pageNo",
  "numOfRows",
  "rcrfrstNm",
  "ctprvnNm",
  "rcrfrstType",
  "rcrfrstAr",
  "aceptncCo",
  "admfee",
  "stayngPosblYn",
  "mainFcltyNm",
  "rdnmadr",
  "institutionNm",
  "telephoneNumber",
  "homepageUrl",
  "latitude",
  "longitude",
  "referenceDate",
  "instt_code",
] as const;

const RECREATION_FOREST_FETCH_ATTEMPTS = 3;

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
    runtimeEnv.RECREATION_FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_RECREATION_FOREST_SERVICE_KEY ??
    runtimeEnv.FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_FOREST_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
    process.env.RECREATION_FOREST_SERVICE_KEY ??
    process.env.VITE_RECREATION_FOREST_SERVICE_KEY ??
    process.env.FOREST_SERVICE_KEY ??
    process.env.VITE_FOREST_SERVICE_KEY ??
    process.env.PUBLIC_DATA_SERVICE_KEY ??
    process.env.VITE_PUBLIC_DATA_SERVICE_KEY ??
    process.env.KMA_SERVICE_KEY ??
    process.env.VITE_KMA_SERVICE_KEY ??
    ""
  );
}

function readQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  for (const key of QUERY_PARAMS) {
    const value = url.searchParams.get(key);
    if (value != null && value !== "") {
      query[key] = value;
    }
  }
  return query;
}

async function fetchRecreationForestsWithRetry(
  query: Parameters<typeof fetchRecreationForests>[0],
): Promise<RecreationForestList> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RECREATION_FOREST_FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchRecreationForests(query);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch recreation forest data.");
}

export async function handleRecreationForestsApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<RecreationForestList>(
      {
        success: false,
        data: null,
        error: "RECREATION_FOREST_SERVICE_KEY or PUBLIC_DATA_SERVICE_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const forests = await fetchRecreationForestsWithRetry({
      serviceKey,
      ...readQuery(url),
      fetchImpl,
    });

    return jsonResponse<RecreationForestList>({
      success: true,
      data: forests,
      cached: false,
    });
  } catch (error) {
    console.warn("휴양림 API 조회 실패:", error);
    return jsonResponse<RecreationForestList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch recreation forest data.",
      },
      500,
    );
  }
}
