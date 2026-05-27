import {
  fetchForestPlantImages,
} from "./forest-plants";
import { fetchForestPlantsFromSupabase } from "./forest-plants-supabase.server";
import type { ApiResponse, ForestPlantImageList, ForestPlantStoryList } from "@/types";

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "public, max-age=21600",
    },
  });
}

function readOptionalSearchParam(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key);
  return value == null || value === "" ? undefined : value;
}

export async function handleForestPlantsApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const searchWrd = readOptionalSearchParam(url, "searchWrd");
  const pageNo = readOptionalSearchParam(url, "pageNo") ?? 1;
  const numOfRows = readOptionalSearchParam(url, "numOfRows") ?? 10;

  void env;
  void fetchImpl;

  try {
    const plants = await fetchForestPlantsFromSupabase({
      searchWrd,
      pageNo,
      numOfRows,
    });

    return jsonResponse<ForestPlantStoryList>({
      success: true,
      data: plants,
      cached: true,
    });
  } catch (error) {
    return jsonResponse<ForestPlantStoryList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to load forest plant CSV data.",
      },
      500,
    );
  }
}

export async function handleForestPlantImagesApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const pageNo = readOptionalSearchParam(url, "pageNo") ?? 1;
  const numOfRows = readOptionalSearchParam(url, "numOfRows") ?? 10;

  void env;
  void fetchImpl;

  try {
    const images = await fetchForestPlantImages({
      pageNo,
      numOfRows,
    });

    return jsonResponse<ForestPlantImageList>({
      success: true,
      data: images,
      cached: true,
    });
  } catch (error) {
    return jsonResponse<ForestPlantImageList>(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch forest plant image data.",
      },
      502,
    );
  }
}
