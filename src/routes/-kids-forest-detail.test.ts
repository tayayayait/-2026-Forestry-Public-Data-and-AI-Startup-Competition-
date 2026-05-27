import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailRouteSource = readFileSync(
  resolve(process.cwd(), "src/routes/facilities/$facilityId.tsx"),
  "utf8",
);
const kidsOverlaySource = readFileSync(
  resolve(process.cwd(), "src/components/forest/KidsForestMapOverlay.tsx"),
  "utf8",
);
const facilityDetailHookSource = readFileSync(
  resolve(process.cwd(), "src/hooks/useFacilityDetail.ts"),
  "utf8",
);
const naverImageApiSource = readFileSync(
  resolve(process.cwd(), "src/lib/naver-image-api-route.ts"),
  "utf8",
);
const kidsForestImageSearchSource = readFileSync(
  resolve(process.cwd(), "src/lib/kids-forest-image-search.ts"),
  "utf8",
);

describe("kids forest facility detail", () => {
  it("lets kids forest map overlays navigate to the shared facility detail route", () => {
    expect(kidsOverlaySource).toContain('to="/facilities/$facilityId"');
    expect(kidsOverlaySource).toContain("facilityId: facility.id");
  });

  it("hydrates the shared detail route with kids forest facilities", () => {
    expect(detailRouteSource).toContain("useKidsForestFacilities");
    expect(detailRouteSource).toContain("kidsForestFacilities?.items");
    expect(detailRouteSource).toContain("combinedFacilities");
  });

  it("uses kids forest specific visit sections and omits unsupported link summary UI", () => {
    expect(detailRouteSource).toContain("KIDS_FOREST_DETAIL_TABS");
    expect(detailRouteSource).toContain('{ id: "programs", label: "프로그램" }');
    expect(detailRouteSource).toContain("방문안내");
    expect(detailRouteSource).toContain("KidsForestVisitInfoSection");
    expect(detailRouteSource).toContain("ProgramInfoSection");
    expect(detailRouteSource).not.toContain("링크요약");
    expect(detailRouteSource).not.toContain("KidsForestLinkSummarySection");
    expect(detailRouteSource).not.toContain("facility.homepage || isKidsForest");
  });

  it("uses child forest specific image search context without blocking detail rendering", () => {
    expect(facilityDetailHookSource).toContain("buildFacilityImageSearchQueries");
    expect(kidsForestImageSearchSource).toContain('facility.type === "kids_forest"');
    expect(kidsForestImageSearchSource).toContain("유아숲체험");
    expect(naverImageApiSource).toContain("kids_forest");
  });
});
