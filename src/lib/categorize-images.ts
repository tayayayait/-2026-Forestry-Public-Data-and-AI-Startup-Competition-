// ──────────────────────────────────────────────────────────────
// 이미지 카테고리 자동 분류 유틸리티
// TourAPI imgName 키워드 기반으로 경치/시설/체험 카테고리 분류
// ──────────────────────────────────────────────────────────────

import type { PhotoCategory, CategorizedImage, PhotoGalleryData, WaypointInfo } from "@/types";
import type { TourDetailImage } from "@/lib/tourapi-detail";

/** 시설 이미지로 부적합한 키워드 (문서, 포스터, 계획서, 기사, 인물 등) */
export const INVALID_IMAGE_KEYWORDS = [
  "계획",
  "보고서",
  "표지",
  "안내도",
  "조감도",
  "포스터",
  "리플렛",
  "팜플렛",
  "정비",
  "연구",
  "전단",
  "도면",
  "뉴스",
  "기자",
  "일보",
  "신문",
  "통신",
  "취임",
  "신임",
  "표창",
  "수상",
  "의원",
  "후보",
  "위원장",
  "씨,",
  "씨 ",
  "1등",
  "개최",
  "간담회",
  // 인물/직책 관련
  "장관",
  "시장",
  "군수",
  "도지사",
  "국장",
  "과장",
  "청장",
  "원장",
  "대표",
  "사장",
  "이사장",
  "총장",
  "학장",
  "교수",
  "박사",
  "당선",
  "축사",
  "인사말",
  "격려",
  "방문",
  // 행사/홍보 관련
  "현수막",
  "배너",
  "기자회견",
  "브리핑",
  "보도",
  "기사",
  "축하",
  "기념식",
  "출범식",
  "발대식",
  "조인식",
  "협약",
  "MOU",
  "서명",
  "체결",
  "준공",
  "기공",
  // 문서/그래픽 관련
  "로고",
  "CI",
  "BI",
  "슬로건",
  "캐릭터",
  "마스코트",
  "infographic",
  "인포그래픽",
  "통계",
  "그래프",
  "차트",
  "festival",
  "페스티벌",
  "공연",
];

/** 인물명 + 직책 패턴 감지 (예: "홍길동 시장", "김OO 위원장") */
const PERSON_TITLE_PATTERN = /[가-힣]{2,4}\s*(시장|군수|도지사|의원|위원장|청장|원장|대표|교수|씨)/;

/** 텍스트가 유효한 이미지인지 검사 */
export function isValidImageText(text?: string): boolean {
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  if (INVALID_IMAGE_KEYWORDS.some((kw) => normalized.includes(kw))) return false;
  if (PERSON_TITLE_PATTERN.test(text)) return false;
  return true;
}

/** 카테고리별 키워드 매핑 규칙 (우선순위: experience > facility > scenery) */
const CATEGORY_KEYWORDS: Record<Exclude<PhotoCategory, "etc">, string[]> = {
  experience: [
    "체험",
    "프로그램",
    "산책",
    "걷기",
    "트레킹",
    "치유",
    "명상",
    "요가",
    "숲해설",
    "교육",
    "놀이",
    "활동",
    "탐방",
    "행사",
    "축제",
    "견학",
    "캠프",
    "워크숍",
    "수업",
    "실습",
  ],
  facility: [
    "시설",
    "건물",
    "내부",
    "객실",
    "화장실",
    "주차",
    "안내소",
    "센터",
    "사무실",
    "관리동",
    "숙박",
    "방갈로",
    "캠핑",
    "매점",
    "식당",
    "카페",
    "놀이터",
    "데크",
    "정자",
    "전시",
    "온실",
    "유리",
    "입구",
    "게이트",
    "로비",
  ],
  scenery: [
    "전경",
    "경치",
    "풍경",
    "자연",
    "숲",
    "산",
    "계곡",
    "호수",
    "일출",
    "일몰",
    "단풍",
    "벚꽃",
    "설경",
    "조망",
    "전망",
    "야경",
    "하늘",
    "구름",
    "바위",
    "폭포",
    "개울",
    "냇가",
    "꽃",
    "나무",
    "정원",
    "수목",
    "연못",
    "습지",
    "초원",
  ],
};

/**
 * imgName(캡션)에서 키워드를 파싱하여 카테고리를 결정합니다.
 * 우선순위: experience > facility > scenery > etc
 */
export function categorizeByImgName(imgName?: string): PhotoCategory {
  if (!imgName || imgName.trim().length === 0) return "etc";

  const normalized = imgName.toLowerCase().replace(/\s+/g, "");

  // 우선순위 순으로 매칭
  const priorities: Exclude<PhotoCategory, "etc">[] = ["experience", "facility", "scenery"];

  for (const category of priorities) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((kw) => normalized.includes(kw))) {
      return category;
    }
  }

  return "etc";
}

/** 시설당 최대 이미지 수 */
const TARGET_IMAGE_COUNT = 15;

/**
 * TourAPI + 경유지 + 네이버 + 카카오 이미지를 통합하여
 * 카테고리별로 그룹화된 PhotoGalleryData를 생성합니다.
 * 소싱 우선순위: TourAPI → 네이버(공식) → 네이버(일반) → 경유지 → 카카오
 */
export function buildPhotoGallery(
  tourImages: TourDetailImage[],
  waypoints: WaypointInfo[],
  naverImages?: CategorizedImage[],
  kakaoImages?: CategorizedImage[],
): PhotoGalleryData {
  const all: CategorizedImage[] = [];

  // 1. TourAPI 이미지 → imgName 기반 자동 분류 (최우선)
  for (const img of tourImages) {
    if (!img.originImgUrl || !isValidImageText(img.imgName)) continue;
    const category = categorizeByImgName(img.imgName);
    all.push({
      url: img.originImgUrl,
      thumbnailUrl: img.smallImageUrl || undefined,
      caption: cleanCaption(img.imgName),
      category,
      source: "tourapi",
    });
  }

  // 2. 네이버 이미지 (공식 사이트 우선, 일반 검색 후순위)
  if (naverImages) {
    // 유효한 이미지만 필터링
    const validNaverImages = naverImages.filter((img) => isValidImageText(img.caption));
    // naver-official을 먼저, naver를 뒤에 배치
    const sorted = [...validNaverImages].sort((a, b) => {
      if (a.source === "naver-official" && b.source !== "naver-official") return -1;
      if (a.source !== "naver-official" && b.source === "naver-official") return 1;
      return 0;
    });
    all.push(...sorted);
  }

  // 3. 경유지(waypoint) 이미지 → experience 카테고리
  for (const wp of waypoints) {
    if (wp.imageUrl && isValidImageText(wp.name)) {
      all.push({
        url: wp.imageUrl,
        caption: wp.name || undefined,
        category: "experience",
        source: "waypoint",
      });
    }
    if (wp.images && isValidImageText(wp.name)) {
      for (const imgUrl of wp.images) {
        all.push({
          url: imgUrl,
          caption: wp.name || undefined,
          category: "experience",
          source: "waypoint",
        });
      }
    }
  }

  // 4. 카카오 폴백 이미지 (최후 수단)
  if (kakaoImages) {
    const validKakaoImages = kakaoImages.filter((img) => isValidImageText(img.caption));
    all.push(...validKakaoImages);
  }

  // 5. 중복 URL 제거
  const seen = new Set<string>();
  const unique = all.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  // 6. 최대 이미지 수 제한 (TARGET_IMAGE_COUNT)
  const capped = unique.slice(0, TARGET_IMAGE_COUNT);

  // 7. 카테고리별 그룹화
  const scenery = capped.filter((img) => img.category === "scenery");
  const facility = capped.filter((img) => img.category === "facility");
  const experience = capped.filter((img) => img.category === "experience");
  const etc = capped.filter((img) => img.category === "etc");

  return { scenery, facility, experience, etc, all: capped };
}

/** imgName에서 불필요한 접두어/확장자 제거 */
function cleanCaption(imgName?: string): string | undefined {
  if (!imgName) return undefined;
  return (
    imgName
      .replace(/\.(jpe?g|png|gif|webp|bmp)$/i, "")
      .replace(/^(IMG|DSC|P|DSCN|DSCF|SAM)[-_]?\d+/i, "")
      .replace(/^\d+[-_]/, "")
      .trim() || undefined
  );
}
