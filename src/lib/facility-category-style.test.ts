import { describe, expect, it } from "vitest";
import { MAP_LEGEND_FACILITY_TYPES, getFacilityCategoryStyle } from "./facility-category-style";

describe("facility category map styles", () => {
  it("assigns distinct map colors to the three visible facility categories", () => {
    const colors = MAP_LEGEND_FACILITY_TYPES.map((type) => getFacilityCategoryStyle(type).marker);

    expect(new Set(colors).size).toBe(3);
    expect(colors).toEqual(["#166534", "#2563eb", "#d97706"]);
  });

  it("keeps a visible legend label and color name for each visible category", () => {
    expect(MAP_LEGEND_FACILITY_TYPES.map((type) => getFacilityCategoryStyle(type).label)).toEqual([
      "치유의숲",
      "자연휴양림",
      "수목원",
    ]);
    expect(
      MAP_LEGEND_FACILITY_TYPES.map((type) => getFacilityCategoryStyle(type).colorName),
    ).toEqual(["숲 초록", "호수 파랑", "정원 금색"]);
  });
});
