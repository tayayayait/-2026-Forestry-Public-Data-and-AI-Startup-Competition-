import { analyzeFacilityHomepage, isAllowedPublicHttpUrl } from "./facility-homepage-analysis";
import {
  createFacilityHomepageAnalysisStore,
  type FacilityHomepageAnalysisStore,
} from "./facility-homepage-analysis-store";
import { DEFAULT_GEMINI_MODEL } from "./gemini-recommendation";
import type { ApiResponse, FacilityHomepageAnalysis, FacilityInfo } from "@/types";

type RuntimeEnv = {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY?: string;
  VITE_GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  VITE_GEMINI_MODEL?: string;
};

type FacilityHomepageAnalysisRequestBody = {
  facilityName?: string;
  homepageUrl?: string;
  facilityType?: FacilityInfo["type"] | string;
  address?: string;
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function cleanConfigValue(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function readApiKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return cleanConfigValue(
    runtimeEnv.GEMINI_API_KEY ??
      runtimeEnv.VITE_GEMINI_API_KEY ??
      runtimeEnv.GOOGLE_GEMINI_API_KEY ??
      runtimeEnv.VITE_GOOGLE_GEMINI_API_KEY ??
      process.env.GEMINI_API_KEY ??
      process.env.VITE_GEMINI_API_KEY ??
      process.env.GOOGLE_GEMINI_API_KEY ??
      process.env.VITE_GOOGLE_GEMINI_API_KEY,
  );
}

function readModel(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return cleanConfigValue(
    runtimeEnv.GEMINI_MODEL ??
      runtimeEnv.VITE_GEMINI_MODEL ??
      process.env.GEMINI_MODEL ??
      process.env.VITE_GEMINI_MODEL ??
      DEFAULT_GEMINI_MODEL,
  );
}

function cleanBodyText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function readRequestBody(request: Request): Promise<FacilityHomepageAnalysisRequestBody> {
  if (!request.body) return {};
  const payload = (await request.json().catch(() => ({}))) as unknown;
  return payload && typeof payload === "object"
    ? (payload as FacilityHomepageAnalysisRequestBody)
    : {};
}

async function readPinnedHomepageAnalysis(
  store: FacilityHomepageAnalysisStore | null,
  homepageUrl: string,
): Promise<FacilityHomepageAnalysis | null> {
  if (!store) return null;

  try {
    return await store.read(homepageUrl);
  } catch {
    return null;
  }
}

async function writePinnedHomepageAnalysis(
  store: FacilityHomepageAnalysisStore | null,
  input: {
    homepageUrl: string;
    facilityName: string;
    analysis: FacilityHomepageAnalysis;
  },
): Promise<void> {
  if (!store) return;

  try {
    await store.write(input);
  } catch {
    // Persistence is an optimization. Gemini analysis should still return.
  }
}

export async function handleFacilityHomepageAnalysisApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
  store: FacilityHomepageAnalysisStore | null = createFacilityHomepageAnalysisStore(env),
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const homepageUrl = cleanBodyText(url.searchParams.get("homepageUrl"));

    if (!homepageUrl) {
      return jsonResponse<FacilityHomepageAnalysis>(
        {
          success: false,
          data: null,
          error: "homepageUrl is required.",
        },
        400,
      );
    }

    if (!isAllowedPublicHttpUrl(homepageUrl)) {
      return jsonResponse<FacilityHomepageAnalysis>(
        {
          success: false,
          data: null,
          error: "homepageUrl must be a public HTTP(S) URL.",
        },
        400,
      );
    }

    const pinnedAnalysis = await readPinnedHomepageAnalysis(store, homepageUrl);
    return jsonResponse<FacilityHomepageAnalysis>({
      success: true,
      data: pinnedAnalysis,
      cached: !!pinnedAnalysis,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse<FacilityHomepageAnalysis>(
      {
        success: false,
        data: null,
        error: "POST method is required.",
      },
      405,
    );
  }

  const body = await readRequestBody(request);
  const facilityName = cleanBodyText(body.facilityName);
  const homepageUrl = cleanBodyText(body.homepageUrl);
  const facilityType = cleanBodyText(body.facilityType);
  const address = cleanBodyText(body.address);

  if (!facilityName || !homepageUrl) {
    return jsonResponse<FacilityHomepageAnalysis>(
      {
        success: false,
        data: null,
        error: "facilityName and homepageUrl are required.",
      },
      400,
    );
  }

  if (!isAllowedPublicHttpUrl(homepageUrl)) {
    return jsonResponse<FacilityHomepageAnalysis>(
      {
        success: false,
        data: null,
        error: "homepageUrl must be a public HTTP(S) URL.",
      },
      400,
    );
  }

  const pinnedAnalysis = await readPinnedHomepageAnalysis(store, homepageUrl);
  if (pinnedAnalysis) {
    return jsonResponse<FacilityHomepageAnalysis>({
      success: true,
      data: pinnedAnalysis,
      cached: true,
    });
  }

  const apiKey = readApiKey(env);
  if (!apiKey) {
    return jsonResponse<FacilityHomepageAnalysis>(
      {
        success: false,
        data: null,
        error: "GEMINI_API_KEY is not configured.",
      },
      500,
    );
  }

  try {
    const data = await analyzeFacilityHomepage({
      apiKey,
      model: readModel(env),
      facilityName,
      homepageUrl,
      facilityType,
      address,
      fetchImpl,
    });

    await writePinnedHomepageAnalysis(store, {
      homepageUrl: data.homepageUrl,
      facilityName,
      analysis: data,
    });

    return jsonResponse<FacilityHomepageAnalysis>({
      success: true,
      data,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<FacilityHomepageAnalysis>(
      {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze the official homepage.",
      },
      502,
    );
  }
}
