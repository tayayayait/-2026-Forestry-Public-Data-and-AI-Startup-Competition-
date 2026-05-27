import type { FacilityInfo } from "@/types";

export const COMMON_TIPS = [
  "방문 전 기상 상태를 확인하고, 우천 시에는 미끄러운 구간에 주의하세요.",
  "충분한 물과 간식을 준비하고, 자외선 차단제를 바르세요.",
];

export const FACILITY_TYPE_TIPS: Partial<Record<FacilityInfo["type"], string[]>> = {
  healing_forest: [
    "산림치유 프로그램은 사전 예약이 필수인 경우가 많습니다. 방문 전 확인하세요.",
    "편안한 운동화와 긴 바지를 착용하면 숲길 걷기가 더 편합니다.",
  ],
  recreation_forest: [
    "성수기(7~8월)에는 숙박 예약이 빨리 마감됩니다. 미리 예약하세요.",
    "계곡 근처는 물놀이 후 저체온에 주의하세요.",
  ],
  arboretum: [
    "계절별 특색 있는 식물을 감상할 수 있으니 방문 시기를 확인하세요.",
    "가이드 투어를 이용하면 더 풍부한 설명을 들을 수 있습니다.",
  ],
  kids_forest: [
    "유아숲체험원은 단체 프로그램 중심으로 운영되는 경우가 많으니 참여방법을 먼저 확인하세요.",
    "아이 동반 방문 시 여벌 옷, 물티슈, 모기 기피제처럼 야외 활동 준비물을 챙기세요.",
  ],
};

export const DEFAULT_TIP = "현지 안내소에서 최신 정보를 확인하세요.";
