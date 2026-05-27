import {
  DEFAULT_GEMINI_MODEL,
  fetchGeminiRecommendationDraft,
  mergeGeminiRecommendationDraft,
} from "./gemini-recommendation";
import { getStaticHealingForestFacilities } from "./healing-forest-facilities";
import { fetchRecreationForests } from "./recreation-forest";
import { mapRecreationForestsToFacilities } from "./public-forest-facilities";
import {
  buildBaseRecommendationFromFacility,
  selectRecommendationCandidate,
} from "./recommendation-scoring";
import { withFacilityTravelEstimates, type LatLng } from "./nearby-facilities";
import type {
  AirQualityData,
  ApiResponse,
  RecommendationResult,
  SurveyAnswers,
  UVIndexData,
  WeatherData,
} from "@/types";

type RuntimeEnv = {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY?: string;
  VITE_GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  VITE_GEMINI_MODEL?: string;
  RECREATION_FOREST_SERVICE_KEY?: string;
  VITE_RECREATION_FOREST_SERVICE_KEY?: string;
  FOREST_SERVICE_KEY?: string;
  VITE_FOREST_SERVICE_KEY?: string;
  PUBLIC_DATA_SERVICE_KEY?: string;
  VITE_PUBLIC_DATA_SERVICE_KEY?: string;
  KMA_SERVICE_KEY?: string;
  VITE_KMA_SERVICE_KEY?: string;
};

type RecommendationRequestBody = {
  profileId?: string;
  facilityId?: string;
  profile?: Partial<SurveyAnswers>;
  location?: LatLng | null;
  environment?: {
    weather?: WeatherData | null;
    airQuality?: AirQualityData | null;
    uvIndex?: number | UVIndexData | null;
    uvLevel?: string | null;
  };
};

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function cleanSecret(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function readApiKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return cleanSecret(
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
  return cleanSecret(
    runtimeEnv.GEMINI_MODEL ??
      runtimeEnv.VITE_GEMINI_MODEL ??
      process.env.GEMINI_MODEL ??
      process.env.VITE_GEMINI_MODEL ??
      DEFAULT_GEMINI_MODEL,
  );
}

function readPublicFacilityServiceKey(env: unknown): string {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  return cleanSecret(
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
      process.env.VITE_KMA_SERVICE_KEY,
  );
}

function normalizeUvIndex(
  value: number | UVIndexData | null | undefined,
  uvLevel?: string | null,
): UVIndexData | null {
  if (!value) return null;
  if (typeof value === "object" && "uvIndex" in value) return value as UVIndexData;
  if (typeof value !== "number") return null;

  return {
    areaNo: "",
    areaName: "",
    date: new Date().toISOString(),
    uvIndex: value,
    uvLevel: (uvLevel ?? "") as UVIndexData["uvLevel"],
    forecastHour: 0,
  };
}

async function readRequestBody(request: Request): Promise<RecommendationRequestBody> {
  if (!request.body) return {};
  const payload = (await request.json().catch(() => ({}))) as unknown;
  return payload && typeof payload === "object" ? (payload as RecommendationRequestBody) : {};
}

async function getRecommendationFacilities(serviceKey: string, fetchImpl: typeof fetch) {
  const healingFacilities = getStaticHealingForestFacilities();
  if (!serviceKey) return healingFacilities;

  const recreationResult = await fetchRecreationForests({
    serviceKey,
    pageNo: 1,
    numOfRows: 1000,
    fetchImpl,
  }).catch(() => null);
  const recreationFacilities =
    recreationResult != null ? mapRecreationForestsToFacilities(recreationResult) : [];
  return [...healingFacilities, ...recreationFacilities];
}

export async function handleRecommendationApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse<RecommendationResult>(
      {
        success: false,
        data: null,
        error: "POST method is required.",
      },
      405,
    );
  }

  const apiKey = readApiKey(env);
  if (!apiKey) {
    return jsonResponse<RecommendationResult>(
      {
        success: false,
        data: null,
        error: "GEMINI_API_KEY is not configured.",
      },
      500,
    );
  }

  const body = await readRequestBody(request);
  const facilities = withFacilityTravelEstimates(
    await getRecommendationFacilities(readPublicFacilityServiceKey(env), fetchImpl),
    body.location,
  );
  const candidate = selectRecommendationCandidate({
    facilities,
    profile: body.profile,
    facilityId: body.facilityId,
  });
  const baseRecommendation = buildBaseRecommendationFromFacility(candidate, {
    profile: body.profile,
    weather: body.environment?.weather ?? null,
    airQuality: body.environment?.airQuality ?? null,
    uvIndex: normalizeUvIndex(body.environment?.uvIndex, body.environment?.uvLevel),
  });

  try {
    const draft = await fetchGeminiRecommendationDraft({
      apiKey,
      model: readModel(env),
      profile: body.profile,
      baseRecommendation,
      fetchImpl,
    });

    return jsonResponse<RecommendationResult>({
      success: true,
      data: mergeGeminiRecommendationDraft(baseRecommendation, draft),
      cached: false,
    });
  } catch (error) {
    return jsonResponse<RecommendationResult>({
      success: true,
      data: baseRecommendation,
      cached: true,
      error: error instanceof Error ? error.message : "Failed to generate Gemini recommendation.",
    });
  }
}
