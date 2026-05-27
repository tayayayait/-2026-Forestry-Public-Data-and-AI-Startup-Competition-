// ──────────────────────────────────────────────────────────────
// 시설 유형별 사진 카테고리 설명 자동 생성
// ──────────────────────────────────────────────────────────────

import type { FacilityType, PhotoCategory } from "@/types";

/** 카테고리 UI 메타 정보 */
export interface CategoryMeta {
  label: string;
  icon: string;
  description: string;
}

const CATEGORY_LABELS: Record<PhotoCategory, { label: string; icon: string }> = {
  scenery: { label: "경치 · 자연", icon: "🏞" },
  facility: { label: "시설 · 편의", icon: "🏠" },
  experience: { label: "체험 · 활동", icon: "🎯" },
  etc: { label: "기타", icon: "📷" },
};

const DESCRIPTIONS: Record<FacilityType, Record<PhotoCategory, string>> = {
  healing_forest: {
    scenery: "치유의숲의 울창한 숲길과 자연 경관을 만나보세요",
    facility: "산림치유 프로그램을 위한 전문 시설을 확인하세요",
    experience: "명상, 산림욕 등 다양한 치유 체험 활동을 둘러보세요",
    etc: "치유의숲의 다양한 모습을 둘러보세요",
  },
  recreation_forest: {
    scenery: "휴양림의 아름다운 자연 풍광을 감상하세요",
    facility: "숙박, 캠핑 등 편의시설 현황을 확인하세요",
    experience: "숲속 놀이, 트레킹 등 다양한 체험을 둘러보세요",
    etc: "휴양림의 다양한 모습을 둘러보세요",
  },
  arboretum: {
    scenery: "수목원의 다채로운 식물과 정원을 감상하세요",
    facility: "전시관, 온실 등 수목원 시설을 확인하세요",
    experience: "식물 관찰, 가이드 투어 등 교육 프로그램을 둘러보세요",
    etc: "수목원의 다양한 모습을 둘러보세요",
  },
  education: {
    scenery: "산림교육장 주변의 아름다운 자연을 감상하세요",
    facility: "교육 시설과 체험관을 확인하세요",
    experience: "산림교육 프로그램과 현장 활동을 둘러보세요",
    etc: "산림교육장의 다양한 모습을 둘러보세요",
  },
  traditional_village_forest: {
    scenery: "마을숲의 고즈넉한 풍경과 자연을 감상하세요",
    facility: "전통 마을의 역사적인 시설을 확인하세요",
    experience: "전통 문화 체험과 마을 탐방을 둘러보세요",
    etc: "전통마을숲의 다양한 모습을 둘러보세요",
  },
};

/**
 * 시설 유형과 카테고리에 맞는 설명 + 레이블 + 아이콘을 반환합니다.
 */
export function getCategoryMeta(facilityType: FacilityType, category: PhotoCategory): CategoryMeta {
  const { label, icon } = CATEGORY_LABELS[category];
  const description =
    DESCRIPTIONS[facilityType]?.[category] ?? DESCRIPTIONS.recreation_forest[category];

  return { label, icon, description };
}

/**
 * 이미지가 있는 카테고리만 필터링하여 반환합니다.
 * "etc"는 다른 카테고리에 이미지가 충분하면 숨깁니다.
 */
export function getActiveCategories(counts: Record<PhotoCategory, number>): PhotoCategory[] {
  const active: PhotoCategory[] = [];

  for (const cat of ["scenery", "facility", "experience"] as PhotoCategory[]) {
    if (counts[cat] > 0) active.push(cat);
  }

  // etc는 다른 카테고리에 분류된 이미지가 없을 때만 표시
  const otherCount = active.reduce((sum, cat) => sum + counts[cat], 0);
  if (counts.etc > 0 && otherCount === 0) {
    active.push("etc");
  }

  return active;
}
