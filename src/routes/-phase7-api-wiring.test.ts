import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readOptionalSource(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const traditionalApiRoutePath = resolve(
  process.cwd(),
  "src/routes/api/traditional-village-forests.ts",
);
const geocodeApiRoutePath = resolve(process.cwd(), "src/routes/api/geocode.ts");
const apiClientSource = readFileSync(resolve(process.cwd(), "src/lib/api-client.ts"), "utf8");
const staticForestLocationSource = readFileSync(
  resolve(process.cwd(), "src/lib/static-forest-location-facilities.ts"),
  "utf8",
);
const filterSource = readFileSync(
  resolve(process.cwd(), "src/components/forest/Map/FilterChips.tsx"),
  "utf8",
);

describe("phase7 API wiring", () => {
  it("exposes local proxy routes for traditional village forests and geocoding", () => {
    expect(readOptionalSource(traditionalApiRoutePath)).toContain(
      'createFileRoute("/api/traditional-village-forests")',
    );
    expect(readOptionalSource(geocodeApiRoutePath)).toContain('createFileRoute("/api/geocode")');
  });

  it("adds API client methods and merges SHP-backed arboretum data into map facilities", () => {
    expect(apiClientSource).toContain("getTraditionalVillageForests");
    expect(apiClientSource).toContain("geocodeAddress");
    expect(apiClientSource).toContain("/api/traditional-village-forests");
    expect(apiClientSource).toContain("/api/geocode");
    expect(apiClientSource).toContain("STATIC_ARBORETUM_FACILITIES");
    expect(staticForestLocationSource).not.toContain("traditional_village_forest");
    expect(staticForestLocationSource).toContain("arboretum");
  });

  it("only exposes map filters backed by current map marker data", () => {
    expect(filterSource).toContain("healing_forest");
    expect(filterSource).toContain("recreation_forest");
    expect(filterSource).not.toContain("traditional_village_forest");
    expect(filterSource).toContain("arboretum");
    expect(filterSource).not.toContain("education");
  });
});
