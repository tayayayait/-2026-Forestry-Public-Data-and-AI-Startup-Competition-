import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const recordsRouteSource = readFileSync(resolve(process.cwd(), "src/routes/records.tsx"), "utf8");

describe("records page wiring", () => {
  it("wires the visit creation form to the visit record hook", () => {
    expect(recordsRouteSource).toContain("createRecord");
    expect(recordsRouteSource).toContain("방문 장소");
    expect(recordsRouteSource).toContain("방문일");
    expect(recordsRouteSource).toContain("방문 전 스트레스");
    expect(recordsRouteSource).toContain("방문 후 스트레스");
    expect(recordsRouteSource).toContain("방문 기록 저장");
  });

  it("shows a visit-record based effect analysis panel", () => {
    expect(recordsRouteSource).toContain("buildEffectAnalysis");
    expect(recordsRouteSource).toContain("3회 이상");
    expect(recordsRouteSource).toContain("효과 분석");
  });
});
