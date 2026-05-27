import { describe, expect, it } from "vitest";
import type { FacilityInfo } from "@/types";
import { buildDataDrivenCuration } from "./data-curation";

function facility(overrides: Partial<FacilityInfo>): FacilityInfo {
  return {
    id: "facility-1",
    name: "테스트 치유의숲",
    type: "healing_forest",
    address: "경기도 양평군 단월면",
    lat: 37.1,
    lng: 127.1,
    programs: ["산림치유"],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: true,
      restroom: true,
      elevator: false,
      helpdog: false,
    },
    ...overrides,
  };
}

describe("buildDataDrivenCuration", () => {
  it("returns public-data based curation cards without seasonal or emotional search labels", () => {
    const items = buildDataDrivenCuration({
      facilities: [
        facility({ id: "healing-1", name: "산음 치유의숲" }),
        facility({
          id: "recreation-1",
          name: "양평 자연휴양림",
          type: "recreation_forest",
          programs: ["자연휴양림", "야영장", "산책로"],
          intro: "숙박가능: 가능",
          maxCapacity: 60,
        }),
      ],
    });

    expect(items).toHaveLength(4);
    expect(items.map((item) => item.id)).toEqual([
      "registered-healing-forest",
      "activity-recreation-forest",
      "small-capacity-recreation-forest",
      "lodging-recreation-forest",
    ]);
    expect(items[0]).toMatchObject({
      label: "치유의숲",
      title: "산림청 등록 치유의숲",
      description: "산림청 치유의숲 현황 API에 등록된 시설입니다.",
      location: "경기도 양평 · 산음 치유의숲",
      facilityId: "healing-1",
    });
    expect(items.map((item) => item.title).join(" ")).not.toContain("꽃 산책");
    expect(items.map((item) => item.title).join(" ")).not.toContain("명상 호흡");
  });

  it("keeps stable fallback locations when matching API facilities are unavailable", () => {
    const items = buildDataDrivenCuration({ facilities: [] });

    expect(items).toHaveLength(4);
    expect(items.every((item) => item.location === "전국 공공 산림 데이터")).toBe(true);
    expect(items.every((item) => item.facilityId == null)).toBe(true);
  });
});
