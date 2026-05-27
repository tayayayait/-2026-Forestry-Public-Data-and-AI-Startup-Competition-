import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const curationRouteSource = readFileSync(resolve(process.cwd(), "src/routes/curation.tsx"), "utf8");

describe("theme curation page", () => {
  it("shows recommendation criteria instead of misleading fixed BEST counts", () => {
    expect(curationRouteSource).not.toContain("BEST");
    expect(curationRouteSource).toContain("추천 기준");
    expect(curationRouteSource).toContain("근거 데이터");
    expect(curationRouteSource).toContain("getCurationMapFilter(data.id)");
    expect(curationRouteSource).toContain("curationFilter?.reason");
    expect(curationRouteSource).toContain("curationFilter?.basis");
  });
});
