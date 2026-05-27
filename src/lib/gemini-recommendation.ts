import type {
  ActivityType,
  EnvironmentAssessment,
  RecommendationResult,
  ScheduleItem,
  SurveyAnswers,
} from "@/types";

const GEMINI_GENERATE_CONTENT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

const ACTIVITY_TYPES = new Set<ActivityType>([
  "forest_bathing",
  "meditation",
  "walking",
  "education",
  "yoga",
  "experience",
  "observation",
]);

export type BuildGeminiGenerateContentUrlOptions = {
  apiKey: string;
  model?: string;
};

export type GeminiRecommendationDraft = {
  matchReason?: string;
  program?: {
    title?: string;
    schedule?: ScheduleItem[];
  };
  environment?: Partial<EnvironmentAssessment>;
  expectedEffects?: Partial<RecommendationResult["expectedEffects"]>;
};

export type FetchGeminiRecommendationDraftOptions = {
  apiKey: string;
  model?: string;
  profile?: Partial<SurveyAnswers>;
  baseRecommendation: RecommendationResult;
  fetchImpl?: typeof fetch;
};

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

function cleanSecret(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function parsePositiveInteger(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeActivityType(value: unknown): ActivityType {
  return typeof value === "string" && ACTIVITY_TYPES.has(value as ActivityType)
    ? (value as ActivityType)
    : "experience";
}

function normalizeSchedule(schedule: unknown): ScheduleItem[] | undefined {
  if (!Array.isArray(schedule)) return undefined;

  const normalized = schedule
    .map((item, index): ScheduleItem | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const activity = cleanText(record.activity);
      const location = cleanText(record.location);
      const description = cleanText(record.description);
      const durationMinutes = parsePositiveInteger(record.durationMinutes);

      if (!activity || !location || !description || !durationMinutes) return null;

      return {
        order: parsePositiveInteger(record.order) ?? index + 1,
        time: cleanText(record.time) ?? "10:00",
        activity,
        type: normalizeActivityType(record.type),
        location,
        description,
        durationMinutes,
      };
    })
    .filter((item): item is ScheduleItem => item != null)
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));

  return normalized.length > 0 ? normalized : undefined;
}

function sumDuration(schedule: ScheduleItem[]): number {
  return schedule.reduce((total, item) => total + item.durationMinutes, 0);
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
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

function buildGeminiPrompt(
  profile: Partial<SurveyAnswers> | undefined,
  baseRecommendation: RecommendationResult,
): string {
  const promptInput = {
    profile: profile ?? {},
    facility: baseRecommendation.facility,
    availableScheduleReference: baseRecommendation.program.schedule,
    environment: baseRecommendation.environment,
  };

  return [
    "너는 산림 치유 코스 설계 AI다.",
    "입력된 사용자 건강 프로필, 시설 정보, 환경 정보를 바탕으로 한국어 맞춤 치유 코스를 만든다.",
    "반드시 JSON만 출력한다. 마크다운, 설명문, 주석은 금지한다.",
    "일정 type은 forest_bathing, meditation, walking, education, yoga, experience, observation 중 하나만 사용한다.",
    "출력 스키마:",
    JSON.stringify({
      matchReason: "string",
      program: {
        title: "string",
        schedule: [
          {
            order: 1,
            time: "10:00",
            activity: "string",
            type: "walking",
            location: "string",
            description: "string",
            durationMinutes: 30,
          },
        ],
      },
      environment: {
        recommendation: "string",
        cautions: ["string"],
      },
      expectedEffects: {
        primary: "string",
        secondary: "string",
        note: "string",
      },
    }),
    "입력:",
    JSON.stringify(promptInput),
  ].join("\n");
}

export function buildGeminiGenerateContentUrl({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
}: BuildGeminiGenerateContentUrlOptions): URL {
  const cleanModel = cleanSecret(model || DEFAULT_GEMINI_MODEL);
  const url = new URL(
    `${GEMINI_GENERATE_CONTENT_BASE_URL}/${encodeURIComponent(cleanModel)}:generateContent`,
  );
  url.searchParams.set("key", cleanSecret(apiKey));
  return url;
}

export function parseGeminiRecommendationDraft(payload: unknown): GeminiRecommendationDraft {
  const text = stripJsonFence(readGeminiText(payload as GeminiGenerateContentResponse));
  const parsed = JSON.parse(text) as unknown;
  const record =
    parsed && typeof parsed === "object" && "response" in parsed
      ? (parsed as { response: unknown }).response
      : parsed;

  if (!record || typeof record !== "object") {
    throw new Error("Gemini response JSON was not an object.");
  }

  return record as GeminiRecommendationDraft;
}

export async function fetchGeminiRecommendationDraft({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  profile,
  baseRecommendation,
  fetchImpl = fetch,
}: FetchGeminiRecommendationDraftOptions): Promise<GeminiRecommendationDraft> {
  const response = await fetchImpl(buildGeminiGenerateContentUrl({ apiKey, model }), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildGeminiPrompt(profile, baseRecommendation),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.45,
        topP: 0.9,
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

  return parseGeminiRecommendationDraft(await response.json());
}

export function mergeGeminiRecommendationDraft(
  baseRecommendation: RecommendationResult,
  draft: GeminiRecommendationDraft,
): RecommendationResult {
  const schedule =
    normalizeSchedule(draft.program?.schedule) ?? baseRecommendation.program.schedule;
  const programTitle = cleanText(draft.program?.title) ?? baseRecommendation.program.title;
  const matchReason = cleanText(draft.matchReason) ?? baseRecommendation.facility.matchReason;

  return {
    ...baseRecommendation,
    facility: {
      ...baseRecommendation.facility,
      matchReason,
    },
    program: {
      title: programTitle,
      schedule,
      totalDurationMinutes: sumDuration(schedule),
    },
    environment: {
      ...baseRecommendation.environment,
      recommendation:
        cleanText(draft.environment?.recommendation) ??
        baseRecommendation.environment.recommendation,
      cautions:
        Array.isArray(draft.environment?.cautions) &&
        draft.environment.cautions.every((item) => typeof item === "string")
          ? draft.environment.cautions.map((item) => item.trim()).filter(Boolean)
          : baseRecommendation.environment.cautions,
    },
    expectedEffects: {
      primary:
        cleanText(draft.expectedEffects?.primary) ?? baseRecommendation.expectedEffects.primary,
      secondary:
        cleanText(draft.expectedEffects?.secondary) ?? baseRecommendation.expectedEffects.secondary,
      note: cleanText(draft.expectedEffects?.note) ?? baseRecommendation.expectedEffects.note,
    },
  };
}
