// ──────────────────────────────────────────────────────────────
// 네이버 이미지 검색 API 서버 프록시 라우트
// 시설 유형별 공식 사이트 지정 검색으로 고품질 이미지 확보
// ──────────────────────────────────────────────────────────────

import type { ApiResponse, FacilityType, CategorizedImage, PhotoCategory } from "@/types";

/** 시설 유형별 공식 사이트 도메인 */
const OFFICIAL_SITE_MAP: Record<FacilityType, string | null> = {
  recreation_forest: "foresttrip.go.kr", // 숲나들e
  healing_forest: "sooperang.go.kr", // 숲e랑
  arboretum: "koagi.or.kr", // 한국수목원정원관리원
  education: null, // 통합 플랫폼 없음
  kids_forest: null, // 지자체별 운영 시설이라 통합 공식 이미지 도메인 없음
  traditional_village_forest: null, // 통합 플랫폼 없음
};

const NAVER_IMAGE_API = "https://openapi.naver.com/v1/search/image";
const MAX_NAVER_IMAGE_DISPLAY = 15;

type RuntimeEnv = {
  NAVER_SEARCH_CLIENT_ID?: string;
  NAVER_SEARCH_CLIENT_SECRET?: string;
};

interface NaverImageItem {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight: string;
  sizewidth: string;
}

interface NaverImageResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverImageItem[];
}

function readNaverKeys(env: unknown): { clientId: string; clientSecret: string } | null {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  const clientId = runtimeEnv.NAVER_SEARCH_CLIENT_ID ?? process.env.NAVER_SEARCH_CLIENT_ID ?? "";
  const clientSecret =
    runtimeEnv.NAVER_SEARCH_CLIENT_SECRET ?? process.env.NAVER_SEARCH_CLIENT_SECRET ?? "";

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** HTML 태그 제거 + 엔티티 디코드 */
function cleanTitle(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** 네이버 이미지 title에서 카테고리 추론 */
function categorizeByTitle(title: string): PhotoCategory {
  const t = title.toLowerCase();
  const expKeywords = ["체험", "프로그램", "교육", "산책", "치유", "명상", "트레킹"];
  const facKeywords = ["시설", "객실", "숙박", "방갈로", "캠핑", "내부", "주차", "안내"];
  if (expKeywords.some((k) => t.includes(k))) return "experience";
  if (facKeywords.some((k) => t.includes(k))) return "facility";
  return "scenery";
}

async function callNaverImageSearch(
  query: string,
  display: number,
  clientId: string,
  clientSecret: string,
  fetchImpl: typeof fetch,
): Promise<NaverImageItem[]> {
  const params = new URLSearchParams({
    query,
    display: `${Math.min(display, 100)}`,
    sort: "sim",
    filter: "large",
  });

  try {
    const response = await fetchImpl(`${NAVER_IMAGE_API}?${params.toString()}`, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      console.error(`Naver Image API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as NaverImageResponse;
    return data.items ?? [];
  } catch (error) {
    console.error("Naver Image API fetch failed:", error);
    return [];
  }
}

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "public, max-age=21600" }, // 6시간 캐싱
  });
}

/**
 * GET /api/naver-images?query={시설명}&facilityType={유형}&display=5
 * 네이버 이미지 검색 API 프록시 — 시설 유형별 공식 사이트 우선 검색
 */
export async function handleNaverImageApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  const facilityType = (url.searchParams.get("facilityType") ??
    "recreation_forest") as FacilityType;
  const display = Math.min(
    Math.max(parseInt(url.searchParams.get("display") ?? "5", 10), 1),
    MAX_NAVER_IMAGE_DISPLAY,
  );

  if (!query) {
    return jsonResponse<CategorizedImage[]>(
      { success: false, data: null, error: "query 파라미터가 필요합니다." },
      400,
    );
  }

  const keys = readNaverKeys(env);
  if (!keys) {
    return jsonResponse<CategorizedImage[]>(
      { success: false, data: null, error: "네이버 검색 API 키가 설정되지 않았습니다." },
      500,
    );
  }

  const results: CategorizedImage[] = [];

  // (1) 공식 사이트 지정 검색 (사이트가 있는 유형만)
  const officialSite = OFFICIAL_SITE_MAP[facilityType];
  if (officialSite) {
    const officialQuery = `${query} site:${officialSite}`;
    const officialItems = await callNaverImageSearch(
      officialQuery,
      Math.min(display, 10),
      keys.clientId,
      keys.clientSecret,
      fetchImpl,
    );

    for (const item of officialItems) {
      results.push({
        url: item.link,
        thumbnailUrl: item.thumbnail,
        caption: cleanTitle(item.title) || undefined,
        category: categorizeByTitle(item.title),
        source: "naver-official",
      });
    }
  }

  // (2) 부족하면 일반 검색으로 보충 (사용자 요청: 오직 시설명만으로 검색)
  if (results.length < display) {
    // 모든 꼼수와 필터 단어를 빼고 순수하게 시설 이름만으로 검색합니다.
    const generalQuery = `${query}`;
    const generalItems = await callNaverImageSearch(
      generalQuery,
      display - results.length,
      keys.clientId,
      keys.clientSecret,
      fetchImpl,
    );

    for (const item of generalItems) {
      // 중복 URL 방지
      if (results.some((r) => r.url === item.link)) continue;
      results.push({
        url: item.link,
        thumbnailUrl: item.thumbnail,
        caption: cleanTitle(item.title) || undefined,
        category: categorizeByTitle(item.title),
        source: "naver",
      });
    }
  }

  return jsonResponse<CategorizedImage[]>({
    success: true,
    data: results,
    cached: false,
  });
}
