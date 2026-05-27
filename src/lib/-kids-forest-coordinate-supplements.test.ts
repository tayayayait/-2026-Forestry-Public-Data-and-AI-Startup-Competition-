import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const supplementPath = resolve(process.cwd(), "src/lib/kids-forest-coordinate-supplements.ts");
const hookSource = readFileSync(
  resolve(process.cwd(), "src/hooks/useKidsForestFacilities.ts"),
  "utf8",
);
const apiRouteSource = readFileSync(
  resolve(process.cwd(), "src/lib/kids-forest-api-route.ts"),
  "utf8",
);

describe("kids forest coordinate supplements", () => {
  it("keeps geocoded coordinate supplements available but excludes them from the operational map", () => {
    expect(existsSync(supplementPath)).toBe(true);

    const supplementSource = readFileSync(supplementPath, "utf8");
    expect(supplementSource).toContain("KIDS_FOREST_GEOCODED_COORDINATE_SUPPLEMENTS");
    expect(supplementSource).toContain("naver_geocoding");
    expect(apiRouteSource).toContain("buildOperationalKidsForestFacilitiesFromCoordinateSeeds");
    expect(apiRouteSource).toContain("KIDS_FOREST_COORDINATE_SEEDS");
    expect(apiRouteSource).not.toContain("KIDS_FOREST_GEOCODED_COORDINATE_SUPPLEMENTS");
    expect(apiRouteSource).not.toContain("KIDS_FOREST_COORDINATE_SEEDS.concat");
  });

  it("versions the client request so previously cached 321-item responses are bypassed", () => {
    expect(hookSource).toContain("KIDS_FOREST_DATA_VERSION");
    expect(hookSource).toContain("datasetVersion=");
    expect(hookSource).toContain('["kids-forest-facilities", KIDS_FOREST_DATA_VERSION]');
  });
});
