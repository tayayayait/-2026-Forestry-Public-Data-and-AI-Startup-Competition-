import { buildGeminiGenerateContentUrl, DEFAULT_GEMINI_MODEL } from "./gemini-recommendation";
import type {
  FacilityHomepageAnalysis,
  FacilityHomepageAnalysisRetrievalStatus,
  FacilityHomepageAnalysisSection,
  FacilityHomepageAnalysisSectionStatus,
  FacilityHomepageAnalysisSectionType,
  FacilityInfo,
} from "@/types";

const SECTION_TYPES: FacilityHomepageAnalysisSectionType[] = [
  "summary",
  "usage",
  "hours",
  "fees",
  "reservation",
  "cautions",
];

const SECTION_TITLES: Record<FacilityHomepageAnalysisSectionType, string> = {
  summary: "요약",
  usage: "이용안내",
  hours: "운영시간",
  fees: "요금",
  reservation: "예약",
  cautions: "주의사항",
};

const FORESTTRIP_HOSTS = new Set(["foresttrip.go.kr", "www.foresttrip.go.kr"]);
const MAX_ANALYSIS_URLS = 8;
const MAX_PAGE_TEXT_CHARS = 12_000;
const MAX_TOTAL_PAGE_TEXT_CHARS = 36_000;
const MAX_TEXT_RESPONSE_BYTES = 600_000;

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

type HomepageAnalysisInput = {
  facilityName: string;
  homepageUrl: string;
  facilityType?: FacilityInfo["type"] | string;
  address?: string;
};

type AnalyzeFacilityHomepageOptions = HomepageAnalysisInput & {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

type OfficialPageText = {
  url: string;
  text: string;
};

type RawHomepageAnalysisSection = {
  type?: unknown;
  title?: unknown;
  status?: unknown;
  items?: unknown;
  sourceUrls?: unknown;
};

type RawHomepageAnalysis = {
  retrievalStatus?: unknown;
  sections?: unknown;
  missingSections?: unknown;
  sourceUrls?: unknown;
  warning?: unknown;
};

function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
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

function normalizeSectionType(value: unknown): FacilityHomepageAnalysisSectionType | null {
  return typeof value === "string" && SECTION_TYPES.includes(value as FacilityHomepageAnalysisSectionType)
    ? (value as FacilityHomepageAnalysisSectionType)
    : null;
}

function normalizeSectionStatus(value: unknown): FacilityHomepageAnalysisSectionStatus {
  return value === "found" || value === "uncertain" || value === "not_found"
    ? value
    : "not_found";
}

function normalizeItems(value: unknown): string[] {
  const rawItems = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return unique(
    rawItems
      .flatMap((item) => {
        const text = cleanText(item);
        return text ? [text] : [];
      })
      .map((item) => (item.length > 500 ? `${item.slice(0, 500).trim()}...` : item)),
  );
}

function normalizeSourceUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(
    value.flatMap((item) => {
      const text = cleanText(item);
      return text && isAllowedPublicHttpUrl(text) ? [new URL(text).toString()] : [];
    }),
  );
}

function normalizeMissingSectionTypes(value: unknown): FacilityHomepageAnalysisSectionType[] {
  if (!Array.isArray(value)) return [];
  return unique(
    value.flatMap((item) => {
      const type = normalizeSectionType(item);
      return type ? [type] : [];
    }),
  ) as FacilityHomepageAnalysisSectionType[];
}

function mergeSection(
  sectionsByType: Map<FacilityHomepageAnalysisSectionType, FacilityHomepageAnalysisSection>,
  section: FacilityHomepageAnalysisSection,
) {
  const current = sectionsByType.get(section.type);
  if (!current) {
    sectionsByType.set(section.type, section);
    return;
  }

  sectionsByType.set(section.type, {
    ...current,
    status: current.status === "found" || section.status === "found" ? "found" : "uncertain",
    items: unique([...current.items, ...section.items]),
    sourceUrls: unique([...current.sourceUrls, ...section.sourceUrls]),
  });
}

function normalizeSections(rawSections: unknown): {
  sections: FacilityHomepageAnalysisSection[];
  presentTypes: Set<FacilityHomepageAnalysisSectionType>;
} {
  const sectionsByType = new Map<
    FacilityHomepageAnalysisSectionType,
    FacilityHomepageAnalysisSection
  >();
  if (!Array.isArray(rawSections)) {
    return { sections: [], presentTypes: new Set() };
  }

  for (const rawSection of rawSections) {
    if (!rawSection || typeof rawSection !== "object") continue;
    const fields = rawSection as RawHomepageAnalysisSection;
    const type = normalizeSectionType(fields.type);
    if (!type) continue;

    const status = normalizeSectionStatus(fields.status);
    const items = normalizeItems(fields.items);
    const sourceUrls = normalizeSourceUrls(fields.sourceUrls);

    if (status === "found" && items.length > 0 && sourceUrls.length > 0) {
      mergeSection(sectionsByType, {
        type,
        title: cleanText(fields.title) ?? SECTION_TITLES[type],
        status: "found",
        items,
        sourceUrls,
      });
      continue;
    }

    if (status === "uncertain" || (status === "found" && items.length > 0)) {
      mergeSection(sectionsByType, {
        type,
        title: cleanText(fields.title) ?? SECTION_TITLES[type],
        status: "uncertain",
        items: items.length > 0 ? items : ["확실한 정보 없음"],
        sourceUrls,
      });
    }
  }

  return {
    sections: SECTION_TYPES.flatMap((type) => {
      const section = sectionsByType.get(type);
      return section ? [section] : [];
    }),
    presentTypes: new Set(sectionsByType.keys()),
  };
}

function parseGeminiHomepageAnalysis(
  payload: unknown,
  context: {
    input: HomepageAnalysisInput;
    sourceUrls: string[];
    retrievalStatus: FacilityHomepageAnalysisRetrievalStatus;
    warning?: string;
  },
): FacilityHomepageAnalysis {
  const text = stripJsonFence(readGeminiText(payload as GeminiGenerateContentResponse));
  const parsed = JSON.parse(text) as unknown;
  const raw =
    parsed && typeof parsed === "object" && "response" in parsed
      ? ((parsed as { response: unknown }).response as RawHomepageAnalysis)
      : (parsed as RawHomepageAnalysis);

  if (!raw || typeof raw !== "object") {
    throw new Error("Gemini homepage analysis JSON was not an object.");
  }

  const { sections, presentTypes } = normalizeSections(raw.sections);
  const explicitMissing = normalizeMissingSectionTypes(raw.missingSections);
  const missingSections = SECTION_TYPES.filter(
    (type) => !presentTypes.has(type) || explicitMissing.includes(type),
  );
  const sectionSourceUrls = sections.flatMap((section) => section.sourceUrls);
  const rawSourceUrls = normalizeSourceUrls(raw.sourceUrls);
  const sourceUrls = unique([...sectionSourceUrls, ...rawSourceUrls, ...context.sourceUrls]).slice(
    0,
    MAX_ANALYSIS_URLS,
  );

  return {
    facilityName: context.input.facilityName,
    homepageUrl: new URL(context.input.homepageUrl).toString(),
    analyzedAt: new Date().toISOString(),
    retrievalStatus: context.retrievalStatus,
    sections,
    missingSections,
    sourceUrls,
    warning: cleanText(raw.warning) ?? context.warning,
  };
}

export function isAllowedPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) return false;
    if (hostname === "metadata.google.internal") return false;
    if (!hostname.includes(".") && !hostname.includes(":")) return false;
    if (hostname.includes(":")) return false;

    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return true;

    const octets = ipv4.slice(1).map((part) => Number.parseInt(part, 10));
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return false;
    }

    const [a, b] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  } catch {
    return false;
  }
}

export function deriveOfficialAnalysisUrls(homepageUrl: string): string[] {
  const url = new URL(homepageUrl);
  const urls = [url.toString()];
  const hostname = url.hostname.toLowerCase();
  const hmpgId = url.searchParams.get("hmpgId")?.trim();

  if (FORESTTRIP_HOSTS.has(hostname) && hmpgId) {
    const encodedHmpgId = encodeURIComponent(hmpgId);
    urls.push(
      `https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=${encodedHmpgId}&menuId=004002001&ruleId=201`,
      `https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=${encodedHmpgId}&menuId=004002005&ruleId=205`,
      `https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=${encodedHmpgId}&menuId=004002008&ruleId=208`,
    );
  }

  return unique(urls).filter(isAllowedPublicHttpUrl).slice(0, MAX_ANALYSIS_URLS);
}

function decodeBasicHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function htmlToPlainText(html: string): string {
  return decodeBasicHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6]|section|article|main)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isTextLikeContentType(contentType: string | null): boolean {
  const value = (contentType ?? "").toLowerCase();
  return (
    value.includes("text/html") ||
    value.includes("text/plain") ||
    value.includes("application/json") ||
    value.includes("application/xml") ||
    value.includes("text/xml")
  );
}

async function fetchOfficialPageText(
  url: string,
  fetchImpl: typeof fetch,
): Promise<OfficialPageText | null> {
  if (!isAllowedPublicHttpUrl(url)) return null;

  const response = await fetchImpl(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.5",
    },
  });
  if (!response.ok) return null;

  const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_TEXT_RESPONSE_BYTES) return null;
  if (!isTextLikeContentType(response.headers.get("content-type"))) return null;

  const rawText = await response.text();
  const text = htmlToPlainText(rawText).slice(0, MAX_PAGE_TEXT_CHARS);
  return text ? { url, text } : null;
}

async function collectFallbackPageTexts(
  urls: string[],
  fetchImpl: typeof fetch,
): Promise<OfficialPageText[]> {
  const settled = await Promise.allSettled(urls.map((url) => fetchOfficialPageText(url, fetchImpl)));
  const pages = settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );

  let total = 0;
  return pages.flatMap((page) => {
    if (total >= MAX_TOTAL_PAGE_TEXT_CHARS) return [];
    const remaining = MAX_TOTAL_PAGE_TEXT_CHARS - total;
    const text = page.text.slice(0, remaining);
    total += text.length;
    return text ? [{ ...page, text }] : [];
  });
}

function buildPrompt(input: HomepageAnalysisInput, urls: string[], pages?: OfficialPageText[]): string {
  const schema = {
    retrievalStatus: "success | partial | failed",
    sections: [
      {
        type: "summary | usage | hours | fees | reservation | cautions",
        title: "string",
        status: "found | not_found | uncertain",
        items: ["string"],
        sourceUrls: ["string"],
      },
    ],
    missingSections: ["summary | usage | hours | fees | reservation | cautions"],
    sourceUrls: ["string"],
    warning: "string | optional",
  };
  const target = {
    facilityName: input.facilityName,
    facilityType: input.facilityType ?? "",
    address: input.address ?? "",
    homepageUrl: input.homepageUrl,
    officialUrls: urls,
  };

  return [
    "너는 대한민국 산림·관광 시설 공식 홈페이지 분석기다.",
    "공식 홈페이지 본문 또는 제공된 URL의 내용에 명시된 정보만 사용한다.",
    "명시되지 않은 항목은 추측하지 말고 status를 not_found로 둔다.",
    "일반 상식, 유사 시설 정보, 모델의 사전 지식으로 보완하지 않는다.",
    "출처 URL을 확인할 수 없는 항목은 status를 uncertain으로 둔다.",
    "사용자에게 필요한 핵심 정보만 한국어로 짧게 정리한다.",
    "반드시 JSON만 출력한다. 마크다운, 주석, 설명문은 금지한다.",
    "출력 스키마:",
    JSON.stringify(schema),
    "분석 대상:",
    JSON.stringify(target),
    pages?.length
      ? [
          "서버가 직접 수집한 공식 페이지 텍스트:",
          JSON.stringify(
            pages.map((page) => ({
              url: page.url,
              text: page.text,
            })),
          ),
        ].join("\n")
      : "위 officialUrls는 URL Context 도구로 직접 조회한다.",
  ].join("\n");
}

async function fetchGeminiHomepageAnalysis({
  apiKey,
  model,
  input,
  urls,
  pages,
  useUrlContext,
  retrievalStatus,
  warning,
  fetchImpl,
}: {
  apiKey: string;
  model: string;
  input: HomepageAnalysisInput;
  urls: string[];
  pages?: OfficialPageText[];
  useUrlContext: boolean;
  retrievalStatus: FacilityHomepageAnalysisRetrievalStatus;
  warning?: string;
  fetchImpl: typeof fetch;
}): Promise<FacilityHomepageAnalysis> {
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildPrompt(input, urls, pages),
          },
        ],
      },
    ],
    ...(useUrlContext ? { tools: [{ url_context: {} }] } : {}),
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      responseMimeType: "application/json",
    },
  };

  const response = await fetchImpl(buildGeminiGenerateContentUrl({ apiKey, model }), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      errorBody
        ? `Gemini HTTP error: ${response.status}: ${errorBody.slice(0, 800)}`
        : `Gemini HTTP error: ${response.status}`,
    );
  }

  return parseGeminiHomepageAnalysis(await response.json(), {
    input,
    sourceUrls: pages?.map((page) => page.url) ?? urls,
    retrievalStatus,
    warning,
  });
}

export async function analyzeFacilityHomepage({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  fetchImpl = fetch,
  facilityName,
  homepageUrl,
  facilityType,
  address,
}: AnalyzeFacilityHomepageOptions): Promise<FacilityHomepageAnalysis> {
  const input = {
    facilityName: facilityName.trim(),
    homepageUrl: new URL(homepageUrl).toString(),
    facilityType,
    address,
  };
  const urls = deriveOfficialAnalysisUrls(input.homepageUrl);
  if (urls.length === 0) {
    throw new Error("No public official homepage URL is available for analysis.");
  }

  try {
    return await fetchGeminiHomepageAnalysis({
      apiKey,
      model,
      input,
      urls,
      useUrlContext: true,
      retrievalStatus: "success",
      fetchImpl,
    });
  } catch (urlContextError) {
    const pages = await collectFallbackPageTexts(urls, fetchImpl);
    if (pages.length === 0) {
      throw urlContextError;
    }

    return await fetchGeminiHomepageAnalysis({
      apiKey,
      model,
      input,
      urls,
      pages,
      useUrlContext: false,
      retrievalStatus: "partial",
      warning: "Gemini URL Context 분석 실패 후 서버 수집 텍스트로 분석했습니다.",
      fetchImpl,
    });
  }
}
