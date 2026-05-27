import { buildGeminiGenerateContentUrl, DEFAULT_GEMINI_MODEL } from "./gemini-recommendation";
import type { CategorizedImage, PhotoCategory } from "@/types";

const MAX_IMAGE_ANALYSIS_CANDIDATES = 15;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const GEMINI_IMAGE_BATCH_SIZE = 6;
const MIN_ACCEPT_SCORE = 70;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiImageJudgment = {
  id: number;
  accept: boolean;
  score: number;
  category: PhotoCategory | "reject";
  reason?: string;
};

type DownloadedImageCandidate = {
  id: number;
  image: CategorizedImage;
  mimeType: string;
  data: string;
};

export type CurateImagesByGeminiPixelsOptions = {
  apiKey: string;
  model?: string;
  facilityName: string;
  images: CategorizedImage[];
  fetchImpl?: typeof fetch;
};

export type GeminiPixelCurationResult = {
  images: CategorizedImage[];
  judged: boolean;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function isSupportedImageMimeType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType.toLowerCase().split(";")[0]?.trim() ?? "",
  );
}

function normalizeMimeType(value: string | null): string | null {
  if (!value) return null;
  const mimeType = value.toLowerCase().split(";")[0]?.trim() ?? "";
  return isSupportedImageMimeType(mimeType) ? mimeType : null;
}

function getCandidateFetchUrls(image: CategorizedImage): string[] {
  return [image.url, image.thumbnailUrl].filter(
    (value, index, values): value is string =>
      typeof value === "string" && value.length > 0 && values.indexOf(value) === index,
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchImageBytes(
  url: string,
  fetchImpl: typeof fetch,
): Promise<{ mimeType: string; data: string } | null> {
  if (!isHttpUrl(url)) return null;

  const response = await fetchImpl(url, {
    headers: {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8,*/*;q=0.5",
    },
  });
  if (!response.ok) return null;

  const mimeType = normalizeMimeType(response.headers.get("content-type"));
  if (!mimeType) return null;

  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) return null;

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  return {
    mimeType,
    data: arrayBufferToBase64(buffer),
  };
}

async function downloadCandidate(
  image: CategorizedImage,
  id: number,
  fetchImpl: typeof fetch,
): Promise<DownloadedImageCandidate | null> {
  for (const url of getCandidateFetchUrls(image)) {
    try {
      const imageBytes = await fetchImageBytes(url, fetchImpl);
      if (imageBytes) {
        return {
          id,
          image,
          ...imageBytes,
        };
      }
    } catch {
      // Try the next URL, usually the thumbnail fallback.
    }
  }

  return null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildPrompt(facilityName: string, candidates: DownloadedImageCandidate[]): string {
  const candidateMetadata = candidates.map((candidate) => ({
    id: candidate.id,
    caption: candidate.image.caption ?? "",
    source: candidate.image.source ?? "",
    currentCategory: candidate.image.category,
    url: candidate.image.url,
  }));

  return [
    "너는 대한민국 산림 시설 대표 사진을 검수하는 이미지 큐레이터다.",
    `시설명: ${facilityName}`,
    "각 후보 이미지를 실제 픽셀과 메타데이터를 함께 보고 판단한다.",
    "반드시 해당 시설의 실제 장소, 숲, 수목원, 휴양림, 치유의숲, 건물, 입구, 산책로, 전경, 체험 현장으로 보이는 사진만 accept=true로 둔다.",
    "뉴스 화면, 지도, 도면, 조감도, 문서, 포스터, 현수막, 로고, 사람 중심 행사 사진, 부동산/부지 관련 이미지는 accept=false로 둔다.",
    "시설명과 직접 관련이 불명확하면 accept=false로 둔다.",
    "출력은 JSON 배열만 허용한다. 설명문과 마크다운은 금지한다.",
    "스키마:",
    JSON.stringify([
      {
        id: 0,
        accept: true,
        score: 92,
        category: "scenery",
        reason: "실제 시설 전경",
      },
    ]),
    "category는 scenery, facility, experience, reject 중 하나만 사용한다.",
    "후보 메타데이터:",
    JSON.stringify(candidateMetadata),
  ].join("\n");
}

function readGeminiText(payload: GeminiGenerateContentResponse): string {
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not include text content.");
  }

  return text;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

function normalizeCategory(value: unknown, accept: boolean): PhotoCategory | "reject" {
  if (!accept) return "reject";
  return value === "scenery" || value === "facility" || value === "experience" || value === "etc"
    ? value
    : "scenery";
}

function normalizeScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number.parseFloat(`${value}`);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseGeminiImageJudgments(payload: GeminiGenerateContentResponse): GeminiImageJudgment[] {
  const parsed = JSON.parse(stripJsonFence(readGeminiText(payload))) as unknown;
  const records =
    parsed && typeof parsed === "object" && "images" in parsed
      ? (parsed as { images: unknown }).images
      : parsed;

  if (!Array.isArray(records)) {
    throw new Error("Gemini image curation response JSON was not an array.");
  }

  return records.flatMap((record): GeminiImageJudgment[] => {
    if (!record || typeof record !== "object") return [];
    const fields = record as Record<string, unknown>;
    const id = Number.parseInt(`${fields.id}`, 10);
    if (!Number.isInteger(id) || id < 0) return [];

    const accept = fields.accept === true;
    const score = normalizeScore(fields.score);

    return [
      {
        id,
        accept,
        score,
        category: normalizeCategory(fields.category, accept),
        reason: typeof fields.reason === "string" ? fields.reason : undefined,
      },
    ];
  });
}

async function fetchGeminiImageJudgments({
  apiKey,
  model,
  facilityName,
  candidates,
  fetchImpl,
}: {
  apiKey: string;
  model: string;
  facilityName: string;
  candidates: DownloadedImageCandidate[];
  fetchImpl: typeof fetch;
}): Promise<GeminiImageJudgment[]> {
  const parts = [
    { text: buildPrompt(facilityName, candidates) },
    ...candidates.flatMap((candidate) => [
      { text: `후보 이미지 ID: ${candidate.id}` },
      {
        inlineData: {
          mimeType: candidate.mimeType,
          data: candidate.data,
        },
      },
    ]),
  ];

  const response = await fetchImpl(buildGeminiGenerateContentUrl({ apiKey, model }), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      errorBody
        ? `Gemini HTTP error: ${response.status}: ${errorBody.slice(0, 800)}`
        : `Gemini HTTP error: ${response.status}`,
    );
  }

  return parseGeminiImageJudgments((await response.json()) as GeminiGenerateContentResponse);
}

export async function curateImagesByGeminiPixelsWithStatus({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  facilityName,
  images,
  fetchImpl = fetch,
}: CurateImagesByGeminiPixelsOptions): Promise<GeminiPixelCurationResult> {
  const candidates = images.slice(0, MAX_IMAGE_ANALYSIS_CANDIDATES);
  const downloaded = (
    await mapWithConcurrency(candidates, 4, (image, index) =>
      downloadCandidate(image, index, fetchImpl),
    )
  ).filter((candidate): candidate is DownloadedImageCandidate => candidate != null);

  if (downloaded.length === 0) return { images, judged: false };

  const judgments = (
    await Promise.all(
      chunk(downloaded, GEMINI_IMAGE_BATCH_SIZE).map((candidateChunk) =>
        fetchGeminiImageJudgments({
          apiKey,
          model,
          facilityName,
          candidates: candidateChunk,
          fetchImpl,
        }),
      ),
    )
  ).flat();

  if (judgments.length === 0) return { images, judged: false };

  const acceptedById = new Map(
    judgments
      .filter(
        (judgment) =>
          judgment.accept && judgment.score >= MIN_ACCEPT_SCORE && judgment.category !== "reject",
      )
      .map((judgment) => [judgment.id, judgment]),
  );

  return {
    judged: true,
    images: candidates
      .flatMap((image, index) => {
        const judgment = acceptedById.get(index);
        if (!judgment) return [];
        return [
          {
            image: {
              ...image,
              category: judgment.category as PhotoCategory,
            },
            score: judgment.score,
          },
        ];
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.image),
  };
}

export async function curateImagesByGeminiPixels(
  options: CurateImagesByGeminiPixelsOptions,
): Promise<CategorizedImage[]> {
  return (await curateImagesByGeminiPixelsWithStatus(options)).images;
}
