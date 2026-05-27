import { describe, expect, it } from "vitest";

import { buildEffectAnalysis } from "./effect-analysis";
import type { VisitRecord } from "@/types";

function visitRecord(overrides: Partial<VisitRecord>): VisitRecord {
  return {
    id: "visit-1",
    userId: "user-1",
    facilityName: "Forest Center",
    visitDate: new Date("2026-05-21"),
    durationMinutes: 60,
    activities: ["walking"],
    preStress: 8,
    postStress: 4,
    preSleep: "poor",
    postSleep: "normal",
    photos: [],
    createdAt: new Date("2026-05-21T01:00:00.000Z"),
    ...overrides,
  };
}

describe("buildEffectAnalysis", () => {
  it("requires at least three visit records before analysis is available", () => {
    const result = buildEffectAnalysis([
      visitRecord({ id: "visit-1" }),
      visitRecord({ id: "visit-2" }),
    ]);

    expect(result.canAnalyze).toBe(false);
    expect(result.currentRecords).toBe(2);
    expect(result.requiredRecords).toBe(3);
    expect(result.message).toContain("3회 이상");
    expect(result.analysis).toBeNull();
  });

  it("calculates a positive stress reduction trend from visit records", () => {
    const result = buildEffectAnalysis([
      visitRecord({ id: "visit-1", facilityName: "A", preStress: 8, postStress: 4 }),
      visitRecord({ id: "visit-2", facilityName: "A", preStress: 6, postStress: 3 }),
      visitRecord({ id: "visit-3", facilityName: "B", preStress: 9, postStress: 6 }),
    ]);

    expect(result.canAnalyze).toBe(true);
    expect(result.analysis).toMatchObject({
      overallTrend: "positive",
      stressReductionPct: 44,
    });
    expect(result.analysis?.summary).toContain("평균");
    expect(result.analysis?.insights.length).toBeGreaterThanOrEqual(2);
    expect(result.analysis?.nextRecommendation).toContain("A");
    expect(result.analysis?.disclaimer).toContain("의료");
  });

  it("marks the trend as negative when stress does not improve", () => {
    const result = buildEffectAnalysis([
      visitRecord({ id: "visit-1", preStress: 4, postStress: 6 }),
      visitRecord({ id: "visit-2", preStress: 5, postStress: 5 }),
      visitRecord({ id: "visit-3", preStress: 3, postStress: 4 }),
    ]);

    expect(result.canAnalyze).toBe(true);
    expect(result.analysis?.overallTrend).toBe("negative");
    expect(result.analysis?.stressReductionPct).toBeLessThanOrEqual(0);
  });
});
