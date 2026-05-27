import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./appStore";
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

describe("visit history summary", () => {
  beforeEach(() => {
    useAppStore.setState({
      visitHistory: {
        summary: { totalVisits: 0, uniqueFacilities: 0, consecutiveWeeks: 0 },
        records: [],
      },
    });
  });

  it("derives total visits, unique facilities, and consecutive weekly visits from loaded records", () => {
    const records = [
      visitRecord({
        id: "visit-1",
        facilityName: "Forest Center",
        visitDate: new Date("2026-05-21"),
      }),
      visitRecord({
        id: "visit-2",
        facilityName: "Forest Center",
        visitDate: new Date("2026-05-14"),
      }),
      visitRecord({
        id: "visit-3",
        facilityName: "Mountain Center",
        visitDate: new Date("2026-04-30"),
      }),
    ];

    useAppStore.getState().setVisitHistory(records);

    expect(useAppStore.getState().visitHistory.summary).toEqual({
      totalVisits: 3,
      uniqueFacilities: 2,
      consecutiveWeeks: 2,
    });
  });
});
