// ──────────────────────────────────────────────────────────────
// API Client
// 외부 API는 브라우저에서 직접 호출하지 않고 로컬 서버 프록시를 경유합니다.
// ──────────────────────────────────────────────────────────────

import {
  getStaticHealingForestFacilities,
  mergeHealingForestStatusWithCoordinates,
} from "./healing-forest-facilities";
import { STATIC_ARBORETUM_FACILITIES } from "./static-forest-location-facilities";
import { normalizeFacilityHomepages } from "./facility-homepage";
import type { LatLng } from "./nearby-facilities";
import { mapRecreationForestsToFacilities } from "./public-forest-facilities";
import { toPlantInfoList } from "./forest-plants";
import type { FunctionInvokeOptions } from "@supabase/functions-js";
import type {
  WeatherData,
  AirQualityData,
  FacilityInfo,
  FacilityHomepageAnalysis,
  PlantInfo,
  NearbyPlace,
  RecommendationResult,
  ApiResponse,
  SurveyAnswers,
  HealthProfile,
  VisitRecord,
  SavedCourse,
  UVIndexData,
  ForestEducationProgramList,
  ForestPlantImageList,
  ForestPlantStoryList,
  RecreationForestList,
  HealingForestList,
  TraditionalVillageForestList,
  GeocodingResult,
  CategorizedImage,
} from "@/types";

type EdgeFunctionPayload<T> = {
  data: T;
};

type SavedCourseInput = {
  recommendationId?: string;
  title?: string;
  facilityName?: string;
  memo?: string;
  isBookmarked?: boolean;
};

type SavedCourseUpdateInput = {
  title?: string;
  memo?: string | null;
  isBookmarked?: boolean;
};

export type FacilityHomepageAnalysisInput = {
  facilityName: string;
  homepageUrl: string;
  facilityType?: FacilityInfo["type"];
  address?: string;
};

type LocalApiRequestOptions = {
  timeoutMs?: number;
};

export type RecommendationEnvironmentSnapshot = {
  weather?: WeatherData | null;
  airQuality?: AirQualityData | null;
  uvIndex?: number | null;
  uvLevel?: string | null;
};

type HealthProfileRecord = {
  id: string;
  user_id: string;
  stress_level: number;
  sleep_quality: HealthProfile["sleepQuality"];
  fitness_level: HealthProfile["fitnessLevel"];
  preferred_activities: HealthProfile["preferredActivities"];
  companions: HealthProfile["companions"];
  max_travel_time: number;
  accessibility_needs: HealthProfile["accessibilityNeeds"];
  created_at: string;
  updated_at: string;
};

type RecommendationRecord = {
  id: string;
  facility_data: RecommendationResult["facility"];
  program_data: RecommendationResult["program"];
  environment_data: RecommendationResult["environment"];
  expected_effects: RecommendationResult["expectedEffects"] | null;
  nearby_places: RecommendationResult["nearby"] | null;
  created_at: string;
};

type VisitRecordRecord = {
  id: string;
  user_id: string;
  recommendation_id?: string | null;
  facility_name: string;
  visit_date: string;
  duration_minutes?: number | null;
  activities?: string[] | null;
  pre_stress?: number | null;
  post_stress?: number | null;
  pre_sleep?: VisitRecord["preSleep"] | null;
  post_sleep?: VisitRecord["postSleep"] | null;
  mood_change?: string | null;
  memo?: string | null;
  photos?: string[] | null;
  created_at: string;
};

type SavedCourseRecord = {
  id: string;
  user_id: string;
  recommendation_id?: string | null;
  title: string;
  facility_name: string;
  memo?: string | null;
  is_bookmarked?: boolean | null;
  created_at: string;
  recommendations?: RecommendationRecord | null;
};

function readEdgeData<T>(payload: EdgeFunctionPayload<T> | null): T | null {
  return payload?.data ?? null;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

async function fetchLocalApi(
  input: string,
  { timeoutMs }: LocalApiRequestOptions = {},
): Promise<Response> {
  if (!timeoutMs) return fetch(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function invokeSupabaseFunction<T>(
  functionName: string,
  options?: FunctionInvokeOptions,
): Promise<{ data: T | null; error: { message: string } | null }> {
  if (import.meta.env.PROD && import.meta.env.SSR) {
    return {
      data: null,
      error: { message: "Supabase client is unavailable during SSR." },
    };
  }

  const { supabase } = await import("@/integrations/supabase/client");
  return supabase.functions.invoke<T>(functionName, options);
}

function mapHealthProfile(
  record: HealthProfileRecord | HealthProfile | null,
): HealthProfile | null {
  if (!record) return null;
  if ("stressLevel" in record) {
    return {
      ...record,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }

  return {
    id: record.id,
    userId: record.user_id,
    stressLevel: record.stress_level,
    sleepQuality: record.sleep_quality,
    fitnessLevel: record.fitness_level,
    preferredActivities: record.preferred_activities,
    companions: record.companions,
    maxTravelTime: record.max_travel_time as HealthProfile["maxTravelTime"],
    accessibilityNeeds: record.accessibility_needs,
    createdAt: toDate(record.created_at),
    updatedAt: toDate(record.updated_at),
  };
}

function mapRecommendationRecord(
  record: RecommendationRecord | RecommendationResult | null,
): RecommendationResult | null {
  if (!record) return null;
  if ("facility" in record) {
    return {
      ...record,
      createdAt: toDate(record.createdAt),
    };
  }

  return {
    id: record.id,
    facility: record.facility_data,
    program: record.program_data,
    environment: record.environment_data,
    expectedEffects: record.expected_effects ?? {
      primary: "",
      secondary: "",
      note: "",
    },
    nearby: record.nearby_places ?? [],
    createdAt: toDate(record.created_at),
  };
}

function mapVisitRecord(record: VisitRecordRecord | VisitRecord): VisitRecord {
  if ("facilityName" in record) {
    return {
      ...record,
      visitDate: toDate(record.visitDate),
      createdAt: toDate(record.createdAt),
    };
  }

  return {
    id: record.id,
    userId: record.user_id,
    recommendationId: record.recommendation_id ?? undefined,
    facilityId: (record as any).facility_id ?? undefined,
    facilityName: record.facility_name,
    visitDate: toDate(record.visit_date),
    durationMinutes: record.duration_minutes ?? 0,
    activities: record.activities ?? [],
    preStress: record.pre_stress ?? 0,
    postStress: record.post_stress ?? 0,
    preSleep: record.pre_sleep ?? "normal",
    postSleep: record.post_sleep ?? "normal",
    moodChange: record.mood_change ?? undefined,
    memo: record.memo ?? undefined,
    photos: record.photos ?? [],
    createdAt: toDate(record.created_at),
  };
}

function mapSavedCourse(record: SavedCourseRecord | SavedCourse): SavedCourse {
  if ("facilityName" in record) {
    return {
      ...record,
      createdAt: toDate(record.createdAt),
      recommendation: record.recommendation
        ? mapRecommendationRecord(record.recommendation)
        : record.recommendation,
    };
  }

  return {
    id: record.id,
    userId: record.user_id,
    recommendationId: record.recommendation_id ?? undefined,
    title: record.title,
    facilityName: record.facility_name,
    memo: record.memo ?? undefined,
    isBookmarked: record.is_bookmarked ?? false,
    recommendation: record.recommendations
      ? mapRecommendationRecord(record.recommendations)
      : undefined,
    createdAt: toDate(record.created_at),
  };
}

// 시뮬레이션 딜레이 유틸리티
export const apiClient = {
  async getWeather(lat: number, lng: number): Promise<ApiResponse<WeatherData>> {
    const params = new URLSearchParams({
      lat: `${lat}`,
      lng: `${lng}`,
    });
    const response = await fetch(`/api/weather?${params.toString()}`);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<WeatherData> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "날씨 정보를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<WeatherData>;
  },

  async getUvIndex(lat: number, lng: number): Promise<ApiResponse<UVIndexData>> {
    const params = new URLSearchParams({
      lat: `${lat}`,
      lng: `${lng}`,
    });
    const response = await fetch(`/api/uv-index?${params.toString()}`);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<UVIndexData> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "자외선지수를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<UVIndexData>;
  },

  async getAirQuality(lat: number, lng: number): Promise<ApiResponse<AirQualityData>> {
    const params = new URLSearchParams({
      lat: `${lat}`,
      lng: `${lng}`,
    });
    const response = await fetch(`/api/air-quality?${params.toString()}`);

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<AirQualityData> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "대기질 정보를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<AirQualityData>;
  },

  async getForestEducationPrograms(
    params: {
      eduType?: string;
      searchTitl?: string;
      searchCont?: string;
      pageNo?: string | number;
      numOfRows?: string | number;
    },
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<ForestEducationProgramList>> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, `${value}`);
      }
    }

    let response: Response;
    try {
      response = await fetchLocalApi(
        `/api/forest-education-programs?${searchParams.toString()}`,
        options,
      );
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "산림교육프로그램 요청 시간이 초과되었습니다."
          : "산림교육프로그램 정보를 불러오지 못했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<ForestEducationProgramList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "산림교육프로그램 정보를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<ForestEducationProgramList>;
  },

  async getTraditionalVillageForests(
    params: {
      searchVllgNm?: string;
      searchPlcNm?: string;
      pageNo?: string | number;
      numOfRows?: string | number;
    },
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<TraditionalVillageForestList>> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, `${value}`);
      }
    }

    const query = searchParams.toString();
    let response: Response;
    try {
      response = await fetchLocalApi(
        `/api/traditional-village-forests${query ? `?${query}` : ""}`,
        options,
      );
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "전통마을숲 요청 시간이 초과되었습니다."
          : "전통마을숲 정보를 불러오지 못했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<TraditionalVillageForestList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "전통마을숲 정보를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<TraditionalVillageForestList>;
  },

  async geocodeAddress(
    query: string,
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<GeocodingResult>> {
    const searchParams = new URLSearchParams({ query });

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/geocode?${searchParams.toString()}`, options);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "주소 좌표 변환 요청 시간이 초과되었습니다."
          : "주소 좌표를 불러오지 못했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<GeocodingResult> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "주소 좌표를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<GeocodingResult>;
  },

  async getRecreationForests(
    params: {
      pageNo?: string | number;
      numOfRows?: string | number;
      rcrfrstNm?: string;
      ctprvnNm?: string;
      rcrfrstType?: string;
      rcrfrstAr?: string | number;
      aceptncCo?: string | number;
      admfee?: string;
      stayngPosblYn?: string;
      mainFcltyNm?: string;
      rdnmadr?: string;
      institutionNm?: string;
      telephoneNumber?: string;
      homepageUrl?: string;
      latitude?: string | number;
      longitude?: string | number;
      referenceDate?: string;
      instt_code?: string;
    },
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<RecreationForestList>> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, `${value}`);
      }
    }

    const query = searchParams.toString();

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/recreation-forests${query ? `?${query}` : ""}`, options);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "휴양림 정보 요청 시간이 초과되었습니다."
          : "Failed to load recreation forest data.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<RecreationForestList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load recreation forest data.",
      };
    }

    return (await response.json()) as ApiResponse<RecreationForestList>;
  },

  async getHealingForests(
    params: {
      page?: string | number;
      perPage?: string | number;
    },
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<HealingForestList>> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, `${value}`);
      }
    }

    const query = searchParams.toString();

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/healing-forests${query ? `?${query}` : ""}`, options);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "치유의숲 정보 요청 시간이 초과되었습니다."
          : "Failed to load healing forest data.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<HealingForestList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load healing forest data.",
      };
    }

    return (await response.json()) as ApiResponse<HealingForestList>;
  },

  async getFacilities(): Promise<ApiResponse<FacilityInfo[]>> {
    const [healingResult, recreationResult] = await Promise.allSettled([
      this.getHealingForests({ page: 1, perPage: 100 }),
      this.getRecreationForests({ pageNo: 1, numOfRows: 1000 }),
    ]);

    const healingResponse = healingResult.status === "fulfilled" ? healingResult.value : null;
    const mappedHealingFacilities =
      healingResponse?.success && healingResponse.data
        ? mergeHealingForestStatusWithCoordinates(healingResponse.data)
        : [];
    const healingFacilities =
      mappedHealingFacilities.length > 0
        ? mappedHealingFacilities
        : getStaticHealingForestFacilities();

    const recreationResponse =
      recreationResult.status === "fulfilled" ? recreationResult.value : null;
    const recreationFacilities =
      recreationResponse?.success && recreationResponse.data
        ? mapRecreationForestsToFacilities(recreationResponse.data)
        : [];
    let staticLocationFacilities: FacilityInfo[] = [];
    try {
      const fetchFn = fetch;
      const staticResponse = await fetchFn("/data/static-forest-location-facilities.json");
      if (staticResponse.ok) {
        const parsedStaticFacilities = (await staticResponse.json()) as unknown;
        staticLocationFacilities = Array.isArray(parsedStaticFacilities)
          ? (parsedStaticFacilities as FacilityInfo[])
          : [];
      }
    } catch (err) {
      console.warn("Failed to fetch static facilities", err);
      staticLocationFacilities = STATIC_ARBORETUM_FACILITIES;
    }

    const facilities = [...healingFacilities, ...recreationFacilities, ...staticLocationFacilities];

    const normalizedFacilities = normalizeFacilityHomepages(facilities);

    return {
      success: true,
      data: normalizedFacilities,
      cached: mappedHealingFacilities.length === 0 && recreationFacilities.length === 0,
    };
  },

  async getPlants(
    searchWrd?: string,
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<PlantInfo[]>> {
    const searchParams = new URLSearchParams({
      pageNo: "1",
      numOfRows: "10",
    });
    if (searchWrd) {
      searchParams.set("searchWrd", searchWrd);
    }

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/forest-plants?${searchParams.toString()}`, options);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "식물 정보 요청 시간이 초과되었습니다."
          : "Failed to load forest plant data.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<ForestPlantStoryList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load forest plant data.",
      };
    }

    const payload = (await response.json()) as ApiResponse<ForestPlantStoryList>;
    if (!payload.success || !payload.data) {
      return {
        success: false,
        data: null,
        error: payload.error ?? "Failed to load forest plant data.",
      };
    }

    return {
      success: true,
      data: toPlantInfoList(payload.data),
      cached: payload.cached,
    };
  },

  async getPlantImages(
    storyId: string,
    options?: LocalApiRequestOptions,
  ): Promise<ApiResponse<ForestPlantImageList>> {
    const searchParams = new URLSearchParams({
      searchWrd: storyId,
      pageNo: "1",
      numOfRows: "10",
    });

    let response: Response;
    try {
      response = await fetchLocalApi(
        `/api/forest-plant-images?${searchParams.toString()}`,
        options,
      );
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "식물 이미지 요청 시간이 초과되었습니다."
          : "Failed to load forest plant image data.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<ForestPlantImageList> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load forest plant image data.",
      };
    }

    return (await response.json()) as ApiResponse<ForestPlantImageList>;
  },

  async getNearbyPlaces(lat: number, lng: number): Promise<ApiResponse<NearbyPlace[]>> {
    const params = new URLSearchParams({
      lat: `${lat}`,
      lng: `${lng}`,
      radius: "20000",
      limit: "8",
    });
    const response = await fetch(`/api/tourism?${params.toString()}`);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<
        NearbyPlace[]
      > | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load nearby tourism data.",
      };
    }

    return (await response.json()) as ApiResponse<NearbyPlace[]>;
  },

  async generateRecommendation(
    profileId: string,
    facilityId?: string,
    profile?: Partial<SurveyAnswers>,
    environment?: RecommendationEnvironmentSnapshot,
    location?: LatLng | null,
  ): Promise<ApiResponse<RecommendationResult>> {
    let recommendation: RecommendationResult;
    let recommendationPayload: ApiResponse<RecommendationResult> | null = null;
    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          facilityId,
          profile,
          environment,
          location,
        }),
      });
      recommendationPayload = (await response
        .json()
        .catch(() => null)) as ApiResponse<RecommendationResult> | null;

      if (!response.ok || !recommendationPayload?.success || !recommendationPayload.data) {
        return {
          success: false,
          data: null,
          error: recommendationPayload?.error ?? "Failed to generate recommendation.",
        };
      }

      recommendation = recommendationPayload.data;
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to generate recommendation.",
      };
    }
    const nearbyResponse = await this.getNearbyPlaces(
      recommendation.facility.lat,
      recommendation.facility.lng,
    );
    if (nearbyResponse.success && nearbyResponse.data && nearbyResponse.data.length > 0) {
      recommendation.nearby = nearbyResponse.data;
    }

    return {
      success: true,
      data: recommendation,
      cached: recommendationPayload?.cached,
      error: recommendationPayload?.error,
    };
  },

  // ── Supabase Edge Functions 호출 ──
  async saveHealthProfile(profile: Partial<HealthProfile>): Promise<ApiResponse<HealthProfile>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<HealthProfileRecord>>(
      "health-profile",
      {
        body: profile,
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: mapHealthProfile(readEdgeData(data)) };
  },

  async getHealthProfile(): Promise<ApiResponse<HealthProfile>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<HealthProfileRecord>>(
      "health-profile",
      {
        method: "GET",
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: mapHealthProfile(readEdgeData(data)) };
  },

  async saveRecommendation(
    result: RecommendationResult,
  ): Promise<ApiResponse<RecommendationResult>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<RecommendationRecord>>(
      "recommendations",
      {
        body: result,
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: mapRecommendationRecord(readEdgeData(data)) };
  },

  async getRecommendation(id: string): Promise<ApiResponse<RecommendationResult>> {
    const functionName = `recommendations?id=${encodeURIComponent(id)}`;
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<RecommendationRecord>>(
      functionName,
      {
        method: "GET",
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: mapRecommendationRecord(readEdgeData(data)) };
  },

  async getRecommendationHistory(): Promise<ApiResponse<RecommendationResult[]>> {
    const { data, error } = await invokeSupabaseFunction<
      EdgeFunctionPayload<RecommendationRecord[]>
    >("recommendations", {
      method: "GET",
    });
    if (error) return { success: false, data: null, error: error.message };
    return {
      success: true,
      data: readEdgeData(data)?.map(mapRecommendationRecord).filter(isPresent) ?? [],
    };
  },

  async saveVisitRecord(record: Partial<VisitRecord>): Promise<ApiResponse<VisitRecord>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<VisitRecordRecord>>(
      "visit-records",
      {
        body: record,
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    const savedRecord = readEdgeData(data);
    return { success: true, data: savedRecord ? mapVisitRecord(savedRecord) : null };
  },

  async getVisitRecords(): Promise<ApiResponse<VisitRecord[]>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<VisitRecordRecord[]>>(
      "visit-records",
      {
        method: "GET",
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: readEdgeData(data)?.map(mapVisitRecord) ?? [] };
  },

  async saveCourse(courseData: SavedCourseInput): Promise<ApiResponse<SavedCourse>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<SavedCourseRecord>>(
      "saved-courses",
      {
        body: courseData,
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    const savedCourse = readEdgeData(data);
    return { success: true, data: savedCourse ? mapSavedCourse(savedCourse) : null };
  },

  async getSavedCourses(): Promise<ApiResponse<SavedCourse[]>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<SavedCourseRecord[]>>(
      "saved-courses",
      {
        method: "GET",
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: readEdgeData(data)?.map(mapSavedCourse) ?? [] };
  },

  async updateSavedCourse(
    id: string,
    updates: SavedCourseUpdateInput,
  ): Promise<ApiResponse<SavedCourse>> {
    const { data, error } = await invokeSupabaseFunction<EdgeFunctionPayload<SavedCourseRecord>>(
      `saved-courses?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: updates,
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    const savedCourse = readEdgeData(data);
    return { success: true, data: savedCourse ? mapSavedCourse(savedCourse) : null };
  },

  async deleteSavedCourse(id: string): Promise<ApiResponse<boolean>> {
    const { error } = await invokeSupabaseFunction<{ success: boolean }>(
      `saved-courses?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: true };
  },

  async getTourDetail(contentId: string, contentTypeId?: string): Promise<ApiResponse<unknown>> {
    const searchParams = new URLSearchParams({ contentId });
    if (contentTypeId) searchParams.set("contentTypeId", contentTypeId);

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/tour-detail?${searchParams.toString()}`);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "상세 정보 요청 시간이 초과되었습니다."
          : "관광 상세 정보를 불러오지 못했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "관광 상세 정보를 불러오지 못했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<unknown>;
  },

  async searchTourContent(
    keyword: string,
    contentTypeId?: string,
  ): Promise<ApiResponse<unknown[]>> {
    const searchParams = new URLSearchParams({ keyword });
    if (contentTypeId) searchParams.set("contentTypeId", contentTypeId);

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/tour-search?${searchParams.toString()}`);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "검색 요청 시간이 초과되었습니다."
          : "관광지 검색에 실패했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<unknown[]> | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "관광지 검색에 실패했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<unknown[]>;
  },

  async searchNaverImages(
    query: string,
    facilityType: string,
    display: number = 5,
  ): Promise<
    ApiResponse<
      Array<{
        url: string;
        thumbnailUrl?: string;
        caption?: string;
        category: string;
        source: string;
      }>
    >
  > {
    const searchParams = new URLSearchParams({
      query,
      facilityType,
      display: `${display}`,
    });

    let response: Response;
    try {
      response = await fetchLocalApi(`/api/naver-images?${searchParams.toString()}`, {
        timeoutMs: 8000,
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "네이버 이미지 검색 시간이 초과되었습니다."
          : "네이버 이미지 검색에 실패했습니다.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: "네이버 이미지 검색에 실패했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<
      Array<{
        url: string;
        thumbnailUrl?: string;
        caption?: string;
        category: string;
        source: string;
      }>
    >;
  },

  async getPinnedFacilityImages(facilityId: string): Promise<ApiResponse<CategorizedImage[]>> {
    const searchParams = new URLSearchParams({ facilityId });
    let response: Response;
    try {
      response = await fetchLocalApi(`/api/facility-image-curation?${searchParams.toString()}`, {
        timeoutMs: 5000,
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "이미지 고정 캐시 조회 시간이 초과되었습니다."
          : "이미지 고정 캐시 조회에 실패했습니다.",
      };
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<
        CategorizedImage[]
      > | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "이미지 고정 캐시 조회에 실패했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<CategorizedImage[]>;
  },

  async curateFacilityImages(
    facilityNameOrId: string,
    facilityNameOrImages: string | CategorizedImage[],
    maybeImages?: CategorizedImage[],
  ): Promise<ApiResponse<CategorizedImage[]>> {
    const hasFacilityId = typeof facilityNameOrImages === "string";
    const facilityId = hasFacilityId ? facilityNameOrId : undefined;
    const facilityName = hasFacilityId ? facilityNameOrImages : facilityNameOrId;
    const images = hasFacilityId ? (maybeImages ?? []) : facilityNameOrImages;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response: Response;
    try {
      response = await fetch("/api/facility-image-curation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          facilityId ? { facilityId, facilityName, images } : { facilityName, images },
        ),
        signal: controller.signal,
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: isAbortError(error)
          ? "이미지 큐레이션 요청 시간이 초과되었습니다."
          : "이미지 큐레이션에 실패했습니다.",
      };
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiResponse<
        CategorizedImage[]
      > | null;
      return {
        success: false,
        data: null,
        error: payload?.error ?? "이미지 큐레이션에 실패했습니다.",
      };
    }

    return (await response.json()) as ApiResponse<CategorizedImage[]>;
  },

  async analyzeFacilityHomepage(
    input: FacilityHomepageAnalysisInput,
  ): Promise<ApiResponse<FacilityHomepageAnalysis>> {
    let response: Response;
    try {
      response = await fetch("/api/facility-homepage-analysis", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to analyze the official homepage.",
      };
    }

    const payload = (await response
      .json()
      .catch(() => null)) as ApiResponse<FacilityHomepageAnalysis> | null;

    if (!response.ok || !payload?.success) {
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to analyze the official homepage.",
      };
    }

    return payload;
  },

  async getPinnedFacilityHomepageAnalysis(
    homepageUrl: string,
  ): Promise<ApiResponse<FacilityHomepageAnalysis>> {
    let response: Response;
    try {
      response = await fetch(
        `/api/facility-homepage-analysis?homepageUrl=${encodeURIComponent(homepageUrl)}`,
      );
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to load the homepage analysis.",
      };
    }

    const payload = (await response
      .json()
      .catch(() => null)) as ApiResponse<FacilityHomepageAnalysis> | null;

    if (!response.ok || !payload?.success) {
      return {
        success: false,
        data: null,
        error: payload?.error ?? "Failed to load the homepage analysis.",
      };
    }

    return payload;
  },
};
