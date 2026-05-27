import { describe, expect, it } from "vitest";

import {
  getDisplayDetailSections,
  getSourceDataSections,
  isSourceDataSection,
} from "./FacilityIntroSection";
import type { FacilityDetailSection } from "@/types";

const sections: FacilityDetailSection[] = [
  {
    title: "기본 정보",
    items: [{ label: "주소", value: "경상북도 문경시 불정길 180" }],
  },
  {
    title: "운영 정보",
    items: [
      { label: "휴양림 구분", value: "공유림" },
      { label: "전화번호", value: "054-552-9443" },
      { label: "홈페이지", value: "https://www.mgtpcr.or.kr" },
    ],
  },
  {
    title: "공공데이터 출력값",
    items: [
      { label: "위도", value: "36.62128207" },
      { label: "경도", value: "128.1365074" },
      { label: "데이터 기준일", value: "2025-12-19" },
    ],
  },
  {
    title: "위치도 출력값",
    items: [{ label: "OWNER_NM", value: "국립수목원" }],
  },
];

describe("FacilityIntroSection detail section filtering", () => {
  it("keeps raw source-data sections out of the primary detail cards", () => {
    expect(isSourceDataSection({ title: "공공데이터 출력값" })).toBe(true);
    expect(isSourceDataSection({ title: "위치도 출력값" })).toBe(true);

    expect(getDisplayDetailSections(sections).map((section) => section.title)).toEqual([
      "운영 정보",
    ]);
  });

  it("removes phone and homepage duplicates from secondary detail cards", () => {
    const [operatingSection] = getDisplayDetailSections(sections);

    expect(operatingSection?.items).toEqual([{ label: "휴양림 구분", value: "공유림" }]);
  });

  it("moves public-data and shapefile output sections into the source disclosure group", () => {
    expect(getSourceDataSections(sections).map((section) => section.title)).toEqual([
      "공공데이터 출력값",
      "위치도 출력값",
    ]);
  });
});
