import { describe, expect, it } from "vitest";
import type { FacilityInfo } from "@/types";
import { getCurationMapFilter, matchesCurationMapFilter } from "./curation-map-filters";

function facility(overrides: Partial<FacilityInfo>): FacilityInfo {
  return {
    id: "facility-1",
    name: "테스트 시설",
    type: "healing_forest",
    address: "경기도 양평군",
    lat: 37.1,
    lng: 127.1,
    programs: [],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: false,
      restroom: false,
      elevator: false,
      helpdog: false,
    },
    ...overrides,
  };
}

describe("curation map filters", () => {
  it("defines API-field based filters without injecting emotional search terms", () => {
    expect(getCurationMapFilter("registered-healing-forest")).toMatchObject({
      defaultFacilityType: "healing_forest",
      basis: expect.stringContaining("산림청_치유의숲 현황"),
    });
    expect(getCurationMapFilter("activity-recreation-forest")).toMatchObject({
      defaultFacilityType: "recreation_forest",
      basis: expect.stringContaining("mainFcltyNm"),
    });
    expect(getCurationMapFilter("small-capacity-recreation-forest")).toMatchObject({
      basis: expect.stringContaining("aceptncCo"),
    });
    expect(getCurationMapFilter("lodging-recreation-forest")).toMatchObject({
      basis: expect.stringContaining("stayngPosblYn"),
    });
    expect(JSON.stringify(getCurationMapFilter("registered-healing-forest"))).not.toContain(
      "꽃 산책",
    );
  });

  it("matches registered healing forests by facility type from the healing forest API", () => {
    expect(
      matchesCurationMapFilter(
        facility({
          type: "healing_forest",
        }),
        "registered-healing-forest",
      ),
    ).toBe(true);

    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
        }),
        "registered-healing-forest",
      ),
    ).toBe(false);
  });

  it("matches activity recreation forests by main facility keywords mapped into programs", () => {
    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
          programs: ["자연휴양림", "야영장", "산책로"],
        }),
        "activity-recreation-forest",
      ),
    ).toBe(true);

    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
          programs: ["자연휴양림"],
        }),
        "activity-recreation-forest",
      ),
    ).toBe(false);
  });

  it("matches small-capacity and lodging recreation forests by direct API-derived fields", () => {
    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
          maxCapacity: 80,
        }),
        "small-capacity-recreation-forest",
      ),
    ).toBe(true);

    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
          maxCapacity: 120,
        }),
        "small-capacity-recreation-forest",
      ),
    ).toBe(false);

    expect(
      matchesCurationMapFilter(
        facility({
          type: "recreation_forest",
          intro: "관리기관: 테스트 · 숙박가능: 가능",
        }),
        "lodging-recreation-forest",
      ),
    ).toBe(true);
  });
});
