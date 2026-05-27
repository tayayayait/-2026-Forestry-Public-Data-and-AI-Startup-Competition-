import { fetchHealingForests } from "./healing-forest";
import type { ApiResponse, HealingForestList } from "@/types";

type RuntimeEnv = {
  HEALING_FOREST_SERVICE_KEY?: string;
  VITE_HEALING_FOREST_SERVICE_KEY?: string;
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
    runtimeEnv.HEALING_FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_HEALING_FOREST_SERVICE_KEY ??
    runtimeEnv.FOREST_SERVICE_KEY ??
    runtimeEnv.VITE_FOREST_SERVICE_KEY ??
    runtimeEnv.PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.VITE_PUBLIC_DATA_SERVICE_KEY ??
    runtimeEnv.KMA_SERVICE_KEY ??
    runtimeEnv.VITE_KMA_SERVICE_KEY ??
    process.env.HEALING_FOREST_SERVICE_KEY ??
    process.env.VITE_HEALING_FOREST_SERVICE_KEY ??
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

const HEALING_FOREST_FETCH_ATTEMPTS = 3;

async function fetchHealingForestsWithRetry(
  query: Parameters<typeof fetchHealingForests>[0],
): Promise<HealingForestList> {
  let lastError: unknown;

  for (let attempt = 0; attempt < HEALING_FOREST_FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchHealingForests(query);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch healing forest data.");
}

export async function handleHealingForestsApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const serviceKey = readServiceKey(env);

  if (!serviceKey) {
    return jsonResponse<HealingForestList>(
      {
        success: false,
        data: null,
        error: "HEALING_FOREST_SERVICE_KEY or PUBLIC_DATA_SERVICE_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const forests = await fetchHealingForestsWithRetry({
      serviceKey,
      page: readOptionalSearchParam(url, "page") ?? 1,
      perPage: readOptionalSearchParam(url, "perPage") ?? 10,
      fetchImpl,
    });

    return jsonResponse<HealingForestList>({
      success: true,
      data: forests,
      cached: false,
    });
  } catch (error) {
    console.warn("치유의숲 API 조회 실패:", error);
    return jsonResponse<HealingForestList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch healing forest data.",
      },
      200,
    );
  }
}
