import { describe, expect, it, vi } from "vitest";

import {
  buildGeminiGenerateContentUrl,
  fetchGeminiRecommendationDraft,
  mergeGeminiRecommendationDraft,
  parseGeminiRecommendationDraft,
} from "./gemini-recommendation";
import { getMockRecommendation } from "./mock-data";
import type { SurveyAnswers } from "@/types";

const profile: Partial<SurveyAnswers> = {
  stressLevel: 8,
  sleepQuality: "poor",
  fitnessLevel: "beginner",
  preferredActivities: ["walking", "meditation"],
  companions: "solo",
  maxTravelTime: 60,
  accessibilityNeeds: ["wheelchair"],
};

const draftPayload = {
  response: {
    matchReason: "스트레스와 수면 상태를 고려해 완만한 숲길과 명상 중심으로 구성했습니다.",
    program: {
      title: "저강도 회복 숲 테라피",
      schedule: [
        {
          order: 1,
          time: "10:00",
          activity: "호흡 정리 산책",
          type: "walking" as const,
          location: "무장애 숲길",
          description: "완만한 길에서 호흡을 늦추며 긴장을 낮춥니다.",
          durationMinutes: 35,
        },
      ],
    },
    expectedEffects: {
      primary: "긴장 완화",
      secondary: "수면 리듬 안정",
      note: "의학적 치료가 아닌 웰니스 추천입니다.",
    },
    environment: {
      recommendation: "강한 햇빛 시간대를 피하고 중간 휴식을 포함하세요.",
      cautions: ["수분 섭취"],
    },
  },
};

const geminiPayload = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify(draftPayload),
          },
        ],
      },
    },
  ],
};

describe("buildGeminiGenerateContentUrl", () => {
  it("builds a generateContent URL with the configured model", () => {
    const url = buildGeminiGenerateContentUrl({
      apiKey: "secret-key",
      model: "gemini-3-flash-preview",
    });

    expect(url.origin + url.pathname).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
    );
    expect(url.searchParams.get("key")).toBe("secret-key");
  });
});

describe("parseGeminiRecommendationDraft", () => {
  it("extracts a JSON recommendation draft from Gemini text", () => {
    const parsed = parseGeminiRecommendationDraft(geminiPayload);

    expect(parsed).toMatchObject(draftPayload.response);
  });

  it("accepts fenced JSON responses", () => {
    const parsed = parseGeminiRecommendationDraft({
      candidates: [
        {
          content: {
            parts: [{ text: `\`\`\`json\n${JSON.stringify(draftPayload)}\n\`\`\`` }],
          },
        },
      ],
    });

    expect(parsed.program?.title).toBe("저강도 회복 숲 테라피");
  });
});

describe("fetchGeminiRecommendationDraft", () => {
  it("posts a structured generation request to Gemini", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));

    const draft = await fetchGeminiRecommendationDraft({
      apiKey: "secret-key",
      model: "gemini-3-flash-preview",
      profile,
      baseRecommendation: getMockRecommendation(),
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [requestUrl, init] = fetchImpl.mock.calls[0]!;
    expect(requestUrl.toString()).toContain("gemini-3-flash-preview:generateContent");
    expect(init?.method).toBe("POST");
    expect(JSON.stringify(init?.body)).toContain("responseMimeType");
    expect(draft.program?.schedule?.[0]?.activity).toBe("호흡 정리 산책");
  });

  it("includes the Gemini error body for failed requests", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => new Response("invalid request body", { status: 400 }),
    );

    await expect(
      fetchGeminiRecommendationDraft({
        apiKey: "secret-key",
        model: "gemini-3-flash-preview",
        profile,
        baseRecommendation: getMockRecommendation(),
        fetchImpl,
      }),
    ).rejects.toThrow("invalid request body");
  });
});

describe("mergeGeminiRecommendationDraft", () => {
  it("keeps trusted facility data and applies generated course content", () => {
    const base = getMockRecommendation();
    const merged = mergeGeminiRecommendationDraft(base, draftPayload.response);

    expect(merged.facility).toMatchObject({
      id: base.facility.id,
      name: base.facility.name,
      type: base.facility.type,
      address: base.facility.address,
      lat: base.facility.lat,
      lng: base.facility.lng,
      matchScore: base.facility.matchScore,
    });
    expect(merged.facility.matchReason).toBe(draftPayload.response.matchReason);
    expect(merged.program.title).toBe("저강도 회복 숲 테라피");
    expect(merged.program.totalDurationMinutes).toBe(35);
    expect(merged.expectedEffects.primary).toBe("긴장 완화");
    expect(merged.environment.cautions).toEqual(["수분 섭취"]);
  });
});
