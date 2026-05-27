import { describe, expect, it } from "vitest";

import { matchesRegion } from "./regions";

describe("matchesRegion", () => {
  it("matches regions by administrative address prefix", () => {
    expect(matchesRegion("대전광역시 유성구 구암동 산21-44", "chungcheong")).toBe(true);
    expect(matchesRegion("충청남도 아산시 용화동 산61-43", "chungcheong")).toBe(true);
    expect(matchesRegion("충북 제천시 고암동 산117", "chungcheong")).toBe(true);
  });

  it("does not match region names embedded in town or village names", () => {
    expect(matchesRegion("경상북도 청송군 부남면 대전리 산69-1", "chungcheong")).toBe(false);
    expect(matchesRegion("전라남도 담양군 대전면 평장리 490-2", "chungcheong")).toBe(false);
  });
});
