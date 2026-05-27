import { DEFAULT_GEMINI_MODEL } from "./gemini-recommendation";

const GEMINI_GENERATE_CONTENT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export type PlantRecognitionResult = {
  plantName: string;
  scientificName: string;
  family: string;
  characteristics: string;
  habitat: string;
  floweringPeriod: string;
  medicinalUse: string;
  forestTherapyNote: string;
  confidence: number;
};

export type FetchPlantRecognitionOptions = {
  apiKey: string;
  model?: string;
  imageBase64: string;
  mimeType: string;
  fetchImpl?: typeof fetch;
};

function cleanSecret(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

export async function fetchPlantRecognition({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  imageBase64,
  mimeType,
  fetchImpl = fetch,
}: FetchPlantRecognitionOptions): Promise<PlantRecognitionResult> {
  const cleanModel = cleanSecret(model);
  const url = new URL(
    `${GEMINI_GENERATE_CONTENT_BASE_URL}/${encodeURIComponent(cleanModel)}:generateContent`,
  );
  url.searchParams.set("key", cleanSecret(apiKey));

  const prompt = [
    "너는 한국 산림청의 숲 생태 및 산림치유 전문가이다.",
    "제공된 이미지를 분석하여 식물의 이름을 식별하고, 산림치유 관점에서의 유용성을 포함하여 다음 JSON 형식으로 정확히 응답한다.",
    "반드시 JSON만 반환해야 하며, 마크다운(```json 등)이나 기타 설명은 일절 포함하지 않는다.",
    "{",
    '  "plantName": "식물 이름 (한국어 국명)",',
    '  "scientificName": "학명",',
    '  "family": "과(科)명 (예: 소나무과)",',
    '  "characteristics": "형태적 특징 (50자 이내)",',
    '  "habitat": "주요 서식지",',
    '  "floweringPeriod": "개화 시기 (예: 4~5월)",',
    '  "medicinalUse": "약효 또는 민간 치유 효과",',
    '  "forestTherapyNote": "산림치유 관점에서의 추천 이유 (50자 이내)",',
    '  "confidence": 95',
    "}",
  ].join("\n");

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
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

  const payload = await response.json();
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part: any) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not include text content.");
  }

  const parsed = JSON.parse(stripJsonFence(text));
  return parsed as PlantRecognitionResult;
}
