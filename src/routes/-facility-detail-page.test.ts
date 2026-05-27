import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailRouteSource = readFileSync(
  resolve(process.cwd(), "src/routes/facilities/$facilityId.tsx"),
  "utf8",
);
const mapOverlaySource = readFileSync(
  resolve(process.cwd(), "src/components/forest/Map/MapOverlay.tsx"),
  "utf8",
);
const healingFacilitySource = readFileSync(
  resolve(process.cwd(), "src/lib/healing-forest-facilities.ts"),
  "utf8",
);
const recreationFacilitySource = readFileSync(
  resolve(process.cwd(), "src/lib/public-forest-facilities.ts"),
  "utf8",
);
const staticLocationSource = readFileSync(
  resolve(process.cwd(), "src/lib/static-forest-location-facilities.ts"),
  "utf8",
);

describe("facility detail page", () => {
  it("routes map overlay detail actions to the facility detail page", () => {
    expect(mapOverlaySource).toContain('to="/facilities/$facilityId"');
    expect(mapOverlaySource).toContain("facility.id");
    expect(mapOverlaySource).not.toContain('to="/"');
  });

  it("documents source request params and output fields per supported category", () => {
    expect(detailRouteSource).toContain('createFileRoute("/facilities/$facilityId")');
    expect(detailRouteSource).toContain('"page"');
    expect(detailRouteSource).toContain('"perPage"');
    expect(detailRouteSource).toContain('"rcrfrstNm"');
    expect(detailRouteSource).toContain('"stayngPosblYn"');
    expect(detailRouteSource).toContain('"OWNER_NM"');
    expect(detailRouteSource).toContain('"RCAR_NM"');
  });

  it("keeps facility-specific detail sections from each map data source", () => {
    expect(healingFacilitySource).toContain("detailSections");
    expect(recreationFacilitySource).toContain("detailSections");
    expect(staticLocationSource).toContain("detailSections");
  });

  it("does not fetch optional forest education programs from the detail page", () => {
    expect(detailRouteSource).not.toContain("useForestEducationPrograms");
    expect(detailRouteSource).not.toContain("searchFacilityName");
  });
});
