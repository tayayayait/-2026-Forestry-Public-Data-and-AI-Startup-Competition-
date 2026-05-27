import type { FacilityFullDetail, FacilityInfo } from "@/types";

type UsageInfoOverride = Partial<NonNullable<FacilityFullDetail["usageInfo"]>>;

// 시설명(공백 제거, 소문자)을 키로 사용하여 오버라이드할 정보를 매핑합니다.
const USAGE_INFO_OVERRIDES = new Map<string, UsageInfoOverride>([
  [
    "국립대운산치유의숲",
    {
      restDate: "매주 토, 일요일 휴무",
    },
  ],
  [
    "대운산치유의숲",
    {
      restDate: "매주 토, 일요일 휴무",
    },
  ],
]);

export function getFacilityUsageOverride(
  facility: FacilityInfo,
): UsageInfoOverride | undefined {
  const sanitize = (str: string) => str.replace(/\s+/g, "").toLowerCase();
  const sanitizedTitle = sanitize(facility.name);

  for (const [key, override] of USAGE_INFO_OVERRIDES.entries()) {
    if (sanitizedTitle.includes(sanitize(key)) || sanitize(key).includes(sanitizedTitle)) {
      return override;
    }
  }

  return undefined;
}
