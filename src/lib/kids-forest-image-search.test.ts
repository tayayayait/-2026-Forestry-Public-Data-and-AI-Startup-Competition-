import { describe, expect, it } from "vitest";

import { buildKidsForestImageSearchQueries } from "./kids-forest-image-search";
import type { FacilityInfo } from "@/types";

const kidsForest = {
  id: "kids-forest-changwon-hyeondong",
  name: "창원 현동 유아숲체험원",
  type: "kids_forest",
  address: "경남 창원시 마산합포구 현동 1294",
  lat: 35.1462272,
  lng: 128.5482845,
} satisfies FacilityInfo;

describe("buildKidsForestImageSearchQueries", () => {
  it("keeps an existing kids forest name as the primary image query", () => {
    expect(buildKidsForestImageSearchQueries(kidsForest)[0]).toBe("창원 현동 유아숲체험원");
  });

  it("adds city and district scoped queries without lot-number noise", () => {
    expect(buildKidsForestImageSearchQueries(kidsForest)).toEqual([
      "창원 현동 유아숲체험원",
      "창원시 현동 유아숲체험원",
      "마산합포구 현동 유아숲체험원",
    ]);
  });
});
