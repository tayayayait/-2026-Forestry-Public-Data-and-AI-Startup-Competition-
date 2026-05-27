import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mapRouteSource = readFileSync(resolve(process.cwd(), "src/routes/map.tsx"), "utf8");

describe("map curation search wiring", () => {
  it("reads the curation query parameter and applies curation-specific filtering", () => {
    expect(mapRouteSource).toContain("validateSearch");
    expect(mapRouteSource).toContain("getCurationMapFilter");
    expect(mapRouteSource).toContain("matchesCurationMapFilter");
  });

  it("shows a curation summary and keeps the search box user-driven", () => {
    expect(mapRouteSource).toContain("curationSummary");
    expect(mapRouteSource).toContain("추천 기준");
    expect(mapRouteSource).toContain("데이터 근거");
    expect(mapRouteSource).toContain("filteredFacilities.length");
    expect(mapRouteSource).not.toContain("curationSummary?.searchQuery");
  });

  it("requests current location automatically when entering the full map", () => {
    expect(mapRouteSource).toContain("shouldAutoRequestLocation");
    expect(mapRouteSource).toContain("requestLocation()");
  });
});
