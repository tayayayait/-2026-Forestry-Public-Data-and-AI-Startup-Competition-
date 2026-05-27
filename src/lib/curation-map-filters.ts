import type { CurationId, FacilityInfo, FacilityType } from "@/types";

export type CurationMapFilter = {
  id: CurationId;
  title: string;
  defaultFacilityType: FacilityType | "all";
  basis: string;
  reason: string;
  limit?: number;
};

const CURATION_MAP_FILTERS: Record<CurationId, CurationMapFilter> = {
  "registered-healing-forest": {
    id: "registered-healing-forest",
    title: "산림청 등록 치유의숲",
    defaultFacilityType: "healing_forest",
    basis: "산림청_치유의숲 현황 API: 시설명, 주소, 지역",
    reason: "산림청 치유의숲 현황에 등록된 시설만 표시합니다.",
    limit: 38,
  },
  "activity-recreation-forest": {
    id: "activity-recreation-forest",
    title: "주요시설 기반 활동형 휴양림",
    defaultFacilityType: "recreation_forest",
    basis: "전국휴양림표준데이터: mainFcltyNm 주요시설명",
    reason: "주요시설명에 체험, 야영, 산책로, 캠핑 등 활동 시설 신호가 있는 휴양림을 표시합니다.",
    limit: 20,
  },
  "small-capacity-recreation-forest": {
    id: "small-capacity-recreation-forest",
    title: "소규모 휴양림 후보",
    defaultFacilityType: "recreation_forest",
    basis: "전국휴양림표준데이터: aceptncCo 수용인원수",
    reason: "수용인원 80명 이하로 확인된 자연휴양림을 표시합니다. 실제 혼잡도 데이터는 아닙니다.",
    limit: 14,
  },
  "lodging-recreation-forest": {
    id: "lodging-recreation-forest",
    title: "숙박 가능한 자연휴양림",
    defaultFacilityType: "recreation_forest",
    basis: "전국휴양림표준데이터: stayngPosblYn 숙박가능여부",
    reason: "숙박 가능 여부가 가능으로 확인된 자연휴양림을 표시합니다.",
    limit: 45,
  },

  "seasonal-spring": {
    id: "seasonal-spring",
    title: "여의도 안가도 괜찮아요 · 봄꽃 구경 추천 코스",
    defaultFacilityType: "all",
    basis: "수목원 또는 시설명·주요시설·프로그램에 봄꽃 키워드 포함",
    reason: "다양한 꽃이 있는 수목원이거나 벚꽃, 진달래 등 꽃 관련 키워드가 포함된 시설을 표시합니다.",
    limit: 9,
  },
  "seasonal-summer": {
    id: "seasonal-summer",
    title: "더위를 피해서 · 여름 계곡/숲길 추천 코스",
    defaultFacilityType: "recreation_forest",
    basis: "시설명·주요시설·프로그램에 여름 피서 키워드 포함",
    reason: "계곡, 폭포, 물놀이 등 여름철 피서에 적합한 시설을 우선적으로 표시합니다.",
    limit: 12,
  },
  "seasonal-autumn": {
    id: "seasonal-autumn",
    title: "가을빛 물든 숲 · 단풍 명소 추천 코스",
    defaultFacilityType: "all",
    basis: "시설명·주요시설·프로그램에 단풍/가을 키워드 포함",
    reason: "가을 단풍, 억새 등 가을 정취를 느낄 수 있는 시설을 표시합니다.",
    limit: 12,
  },
  "seasonal-winter": {
    id: "seasonal-winter",
    title: "눈 덮인 겨울산 · 겨울 설경 추천 코스",
    defaultFacilityType: "all",
    basis: "시설명·주요시설·프로그램에 겨울/눈 키워드 포함",
    reason: "설경, 눈, 빙벽 등 겨울 풍경이 아름다운 시설을 표시합니다.",
    limit: 9,
  },
  "family-outing": {
    id: "family-outing",
    title: "가족과 함께 · 아이 동반 나들이 추천 코스",
    defaultFacilityType: "all",
    basis: "체험 키워드 + 쉬운 트레일 보유",
    reason: "체험·놀이 시설과 완만한 코스를 보유한 가족 친화 시설을 표시합니다.",
    limit: 10,
  },
  "forest-camping": {
    id: "forest-camping",
    title: "숲속에서 하룻밤 · 캠핑·야영 추천 코스",
    defaultFacilityType: "recreation_forest",
    basis: "전국휴양림표준데이터: 주요시설명 캠핑/야영 키워드",
    reason: "주요시설명에 캠핑, 야영, 텐트 등 키워드가 포함된 휴양림을 표시합니다.",
    limit: 15,
  },
  "meditation-healing": {
    id: "meditation-healing",
    title: "마음을 비우는 시간 · 명상·치유 프로그램 코스",
    defaultFacilityType: "all",
    basis: "치유의숲 타입 또는 프로그램에 명상·치유·힐링 키워드 포함",
    reason: "치유의숲이거나 명상, 요가, 치유 등 정적 힐링 키워드가 확인된 시설을 표시합니다.",
    limit: 8,
  },
};

const ACTIVITY_FACILITY_KEYWORDS = [
  "체험",
  "야영",
  "캠핑",
  "산책",
  "산책로",
  "숲속",
  "놀이터",
  "수련",
  "탐방",
  "등산",
  "물놀이",
];

const CHERRY_BLOSSOM_KEYWORDS = [
  "벚꽃",
  "벚나무",
  "진달래",
  "철쭉",
  "봄꽃",
  "매화",
  "산수유",
  "꽃길",
  "꽃",
  "야생화",
  "꽃무릇",
  "수국",
];

const SUMMER_KEYWORDS = ["계곡", "폭포", "물놀이", "하천", "수변", "피서"];
const AUTUMN_KEYWORDS = ["단풍", "은행", "억새", "갈대", "가을"];
const WINTER_KEYWORDS = ["설경", "눈", "상고대", "빙벽", "얼음", "겨울"];

const CAMPING_KEYWORDS = ["캠핑", "야영", "텐트", "오토캠핑", "글램핑", "캠프"];

const MEDITATION_KEYWORDS = ["명상", "요가", "치유", "힐링", "테라피", "심신", "마음"];

export function getCurationMapFilters(): CurationMapFilter[] {
  return Object.values(CURATION_MAP_FILTERS);
}

export function getCurationMapFilter(id: string | null | undefined): CurationMapFilter | null {
  if (!id) return null;
  return CURATION_MAP_FILTERS[id as CurationId] ?? null;
}

function facilityText(facility: FacilityInfo): string {
  return [
    facility.name,
    facility.address,
    facility.intro,
    ...facility.programs,
    ...facility.trails.map((trail) => trail.name),
    ...(facility.educationPrograms ?? []).flatMap((program) => [
      program.title,
      program.content,
      program.category,
      program.period,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

export function matchesFacilityText(facility: FacilityInfo, query: string): boolean {
  const tokens = query.trim().toLocaleLowerCase("ko-KR").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const text = facilityText(facility);
  return tokens.some((token) => text.includes(token));
}

function hasAnyKeyword(facility: FacilityInfo, keywords: string[]): boolean {
  const text = facilityText(facility);
  return keywords.some((keyword) => text.includes(keyword.toLocaleLowerCase("ko-KR")));
}

function hasConfirmedLodging(facility: FacilityInfo): boolean {
  const text = facilityText(facility);
  return text.includes("숙박가능: 가능") || text.includes("숙박가능여부: 가능");
}



function hasEasyTrail(facility: FacilityInfo): boolean {
  return facility.trails.some((trail) => trail.difficulty === "easy");
}

export function matchesCurationMapFilter(facility: FacilityInfo, id: CurationId): boolean {
  switch (id) {
    case "registered-healing-forest":
      return facility.type === "healing_forest";
    case "activity-recreation-forest":
      return (
        facility.type === "recreation_forest" && hasAnyKeyword(facility, ACTIVITY_FACILITY_KEYWORDS)
      );
    case "small-capacity-recreation-forest":
      return facility.type === "recreation_forest" && (facility.maxCapacity ?? Infinity) <= 80;
    case "lodging-recreation-forest":
      return facility.type === "recreation_forest" && hasConfirmedLodging(facility);

    case "seasonal-spring":
      return facility.type === "arboretum" || hasAnyKeyword(facility, CHERRY_BLOSSOM_KEYWORDS);
    case "seasonal-summer":
      return hasAnyKeyword(facility, SUMMER_KEYWORDS);
    case "seasonal-autumn":
      return hasAnyKeyword(facility, AUTUMN_KEYWORDS);
    case "seasonal-winter":
      return hasAnyKeyword(facility, WINTER_KEYWORDS);
    case "family-outing":
      return (
        hasEasyTrail(facility) ||
        hasAnyKeyword(facility, [
          "체험",
          "놀이",
          "가족",
          "어린이",
          "놀이터",
          "물놀이",
          "유아",
          "유아숲체원",
          "피크닉",
        ])
      );
    case "forest-camping":
      return facility.type === "recreation_forest" && hasAnyKeyword(facility, CAMPING_KEYWORDS);
    case "meditation-healing":
      return facility.type === "healing_forest" || hasAnyKeyword(facility, MEDITATION_KEYWORDS);
    default:
      return true;
  }
}
