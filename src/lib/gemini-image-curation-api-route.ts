import { curateImagesByGeminiPixelsWithStatus } from "./gemini-image-curation";
import {
  createFacilityImageCurationStore,
  type FacilityImageCurationStore,
} from "./facility-image-curation-store";
import { DEFAULT_GEMINI_MODEL } from "./gemini-recommendation";
import type { ApiResponse, CategorizedImage } from "@/types";

type RuntimeEnv = {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY?: string;
  VITE_GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  VITE_GEMINI_MODEL?: string;
};

type ImageCurationRequestBody = {
  facilityId?: string;
  facilityName?: string;
  images?: CategorizedImage[];
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

async function readRequestBody(request: Request): Promise<ImageCurationRequestBody> {
  if (!request.body) return {};
  const payload = (await request.json().catch(() => ({}))) as unknown;
  return payload && typeof payload === "object" ? (payload as ImageCurationRequestBody) : {};
}

function isCategorizedImage(value: unknown): value is CategorizedImage {
  if (!value || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return typeof fields.url === "string" && typeof fields.category === "string";
}

function normalizeFacilityId(value: unknown, facilityName: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw) return raw;
  return facilityName.trim().replace(/\s+/g, " ").toLowerCase();
}

async function readPinnedImages(
  store: FacilityImageCurationStore | null,
  facilityId: string,
): Promise<CategorizedImage[] | null> {
  if (!store) return null;

  try {
    return await store.read(facilityId);
  } catch {
    return null;
  }
}

async function writePinnedImages(
  store: FacilityImageCurationStore | null,
  input: {
    facilityId: string;
    facilityName: string;
    images: CategorizedImage[];
  },
): Promise<void> {
  if (!store) return;

  try {
    await store.write(input);
  } catch {
    // Supabase persistence failure must not block the detail page response.
  }
}

export async function handleGeminiImageCurationApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
  store: FacilityImageCurationStore | null = createFacilityImageCurationStore(env),
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const facilityId = url.searchParams.get("facilityId")?.trim() ?? "";
    if (!facilityId) {
      return jsonResponse<CategorizedImage[]>(
        {
          success: false,
          data: null,
          error: "facilityId is required.",
        },
        400,
      );
    }

    const pinnedImages = await readPinnedImages(store, facilityId);
    return jsonResponse<CategorizedImage[]>({
      success: true,
      data: pinnedImages,
      cached: Array.isArray(pinnedImages),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse<CategorizedImage[]>(
      {
        success: false,
        data: null,
        error: "POST method is required.",
      },
      405,
    );
  }

  const body = await readRequestBody(request);
  const facilityName = typeof body.facilityName === "string" ? body.facilityName.trim() : "";
  const facilityId = normalizeFacilityId(body.facilityId, facilityName);
  const images = Array.isArray(body.images) ? body.images.filter(isCategorizedImage) : [];

  if (!facilityId || !facilityName || images.length === 0) {
    return jsonResponse<CategorizedImage[]>(
      {
        success: false,
        data: null,
        error: "facilityId, facilityName and images are required.",
      },
      400,
    );
  }

  const pinnedImages = await readPinnedImages(store, facilityId);
  if (pinnedImages) {
    return jsonResponse<CategorizedImage[]>({
      success: true,
      data: pinnedImages,
      cached: true,
    });
  }

  const apiKey = readApiKey(env);
  if (!apiKey) {
    return jsonResponse<CategorizedImage[]>({
      success: true,
      data: images,
      cached: true,
      error: "GEMINI_API_KEY is not configured.",
    });
  }

  try {
    const curation = await curateImagesByGeminiPixelsWithStatus({
      apiKey,
      model: readModel(env),
      facilityName,
      images,
      fetchImpl,
    });

    // 이미지가 있으면 항상 서버에 저장 → 다음 방문자부터 즉시 로드
    if (curation.images.length > 0) {
      await writePinnedImages(store, {
        facilityId,
        facilityName,
        images: curation.images,
      });
    }

    return jsonResponse<CategorizedImage[]>({
      success: true,
      data: curation.images,
      cached: false,
    });
  } catch (error) {
    return jsonResponse<CategorizedImage[]>({
      success: true,
      data: images,
      cached: true,
      error: error instanceof Error ? error.message : "Failed to curate images with Gemini.",
    });
  }
}
