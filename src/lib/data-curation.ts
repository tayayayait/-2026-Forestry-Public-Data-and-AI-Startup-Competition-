import type { CurationId, CurationItem, FacilityInfo } from "@/types";
import { getCurationMapFilters, matchesCurationMapFilter } from "./curation-map-filters";

type DataCurationInput = {
  facilities: FacilityInfo[];
};

type CurationCardMeta = {
  label: string;
  description: string;
  accentColor: string;
};

const FALLBACK_LOCATION = "전국 공공 산림 데이터";

const CARD_META: Record<CurationId, CurationCardMeta> = {
  "registered-healing-forest": {
    label: "치유의숲",
    description: "산림청 치유의숲 현황 API에 등록된 시설입니다.",
    accentColor: "bg-[#E0F2E9]",
  },
  "activity-recreation-forest": {
    label: "주요시설",
    description: "주요시설 정보에 체험·야영·산책로 등 활동 시설이 포함된 휴양림입니다.",
    accentColor: "bg-[#FFF3D6]",
  },
  "small-capacity-recreation-forest": {
    label: "수용인원",
    description: "수용인원 데이터 기준 비교적 작은 자연휴양림을 우선 표시합니다.",
    accentColor: "bg-[#E0EEFF]",
  },
  "lodging-recreation-forest": {
    label: "숙박",
    description: "숙박 가능 여부가 확인된 자연휴양림입니다.",
    accentColor: "bg-forest-100",
  },
  "beginner-trail": {
    label: "초보 산책이",
    description: "난이도 '쉬움', 소요시간 2시간 이내의 완만한 숲길 코스입니다.",
    accentColor: "bg-[#E8F5E9]",
  },
  "cherry-blossom": {
    label: "봄꽃 구경",
    description: "다양한 꽃이 있는 수목원이거나 봄꽃 관련 키워드가 포함된 시설입니다.",
    accentColor: "bg-[#FCE4EC]",
  },
  "family-outing": {
    label: "가족 나들이",
    description: "완만한 숲길, 유아숲체원, 체험 프로그램 등 가족 친화 시설입니다.",
    accentColor: "bg-[#FFF8E1]",
  },
  "forest-camping": {
    label: "캠핑·야영",
    description: "캠핑, 야영, 텐트 등 숲속 캠핑이 가능한 휴양림입니다.",
    accentColor: "bg-[#E3F2FD]",
  },
  "meditation-healing": {
    label: "명상·치유",
    description: "치유의숲이거나 명상, 요가, 치유 등 정적 힐링 키워드가 확인된 시설입니다.",
    accentColor: "bg-[#F3E5F5]",
  },
};

const HOME_CURATION_IDS: CurationId[] = [
  "registered-healing-forest",
  "activity-recreation-forest",
  "small-capacity-recreation-forest",
  "lodging-recreation-forest",
];

function normalizeLocality(value: string): string {
  return value.replace(/(시|군|구)$/u, "");
}

function formatFacilityLocation(facility: FacilityInfo | undefined): string {
  if (!facility) return FALLBACK_LOCATION;

  const [province, locality] = facility.address.split(/\s+/);
  const region = [province, locality ? normalizeLocality(locality) : ""].filter(Boolean).join(" ");
  return `${region || facility.address} · ${facility.name}`;
}

export function buildDataDrivenCuration({ facilities }: DataCurationInput): CurationItem[] {
  return getCurationMapFilters()
    .filter((filter) => HOME_CURATION_IDS.includes(filter.id))
    .map((filter) => {
    const meta = CARD_META[filter.id];
    const matchedFacility = facilities.find((facility) =>
      matchesCurationMapFilter(facility, filter.id),
    );

    return {
      id: filter.id,
      label: meta.label,
      title: filter.title,
      description: meta.description,
      location: formatFacilityLocation(matchedFacility),
      facilityId: matchedFacility?.id,
      accentColor: meta.accentColor,
    };
  });
}
