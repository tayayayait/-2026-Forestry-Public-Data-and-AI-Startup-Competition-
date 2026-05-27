import { describe, expect, it } from "vitest";

import {
  buildBaseRecommendationFromFacility,
  scoreFacilityForProfile,
  selectRecommendationCandidate,
} from "./recommendation-scoring";
import type { FacilityInfo, SurveyAnswers } from "@/types";

function facility(overrides: Partial<FacilityInfo>): FacilityInfo {
  return {
    id: "facility-1",
    name: "Forest Center",
    type: "healing_forest",
    address: "1 Forest Road",
    lat: 37.5,
    lng: 127.5,
    programs: [],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: true,
      restroom: true,
      elevator: false,
      helpdog: false,
    },
    ...overrides,
  };
}

const beginnerWheelchairProfile: Partial<SurveyAnswers> = {
  stressLevel: 8,
  sleepQuality: "poor",
  fitnessLevel: "beginner",
  preferredActivities: ["walking", "meditation"],
  companions: "solo",
  maxTravelTime: 60,
  accessibilityNeeds: ["wheelchair"],
};

describe("scoreFacilityForProfile", () => {
  it("rewards accessible easy walking and meditation candidates for a stressed beginner", () => {
    const accessible = facility({
      accessibility: {
        wheelchair: true,
        stroller: true,
        parking: true,
        restroom: true,
        elevator: true,
        helpdog: true,
      },
      trails: [{ name: "Easy loop", distanceKm: 1.2, difficulty: "easy", estimatedMinutes: 35 }],
      programs: ["forest meditation"],
      distanceMinutes: 45,
    });
    const inaccessible = facility({
      id: "facility-2",
      accessibility: {
        wheelchair: false,
        stroller: false,
        parking: true,
        restroom: true,
        elevator: false,
        helpdog: false,
      },
      trails: [{ name: "Hard ridge", distanceKm: 6, difficulty: "hard", estimatedMinutes: 180 }],
      distanceMinutes: 90,
    });

    expect(scoreFacilityForProfile(accessible, beginnerWheelchairProfile).score).toBeGreaterThan(
      scoreFacilityForProfile(inaccessible, beginnerWheelchairProfile).score,
    );
  });
});

describe("selectRecommendationCandidate", () => {
  it("selects the highest-scoring facility when no explicit facility id is provided", () => {
    const selected = selectRecommendationCandidate({
      facilities: [
        facility({ id: "hard", name: "Hard Forest", trails: [] }),
        facility({
          id: "accessible",
          name: "Accessible Forest",
          accessibility: {
            wheelchair: true,
            stroller: true,
            parking: true,
            restroom: true,
            elevator: true,
            helpdog: true,
          },
          trails: [
            { name: "Barrier-free loop", distanceKm: 1, difficulty: "easy", estimatedMinutes: 30 },
          ],
          programs: ["meditation"],
        }),
      ],
      profile: beginnerWheelchairProfile,
    });

    expect(selected.facility.id).toBe("accessible");
    expect(selected.score).toBeGreaterThan(70);
  });

  it("honors an explicit facility id over the profile score", () => {
    const selected = selectRecommendationCandidate({
      facilities: [
        facility({ id: "best", name: "Best Forest" }),
        facility({ id: "requested", name: "Requested Forest" }),
      ],
      profile: beginnerWheelchairProfile,
      facilityId: "requested",
    });

    expect(selected.facility.id).toBe("requested");
  });
});

describe("buildBaseRecommendationFromFacility", () => {
  it("creates a trusted base recommendation from scored public facility data", () => {
    const candidate = selectRecommendationCandidate({
      facilities: [
        facility({
          id: "accessible",
          name: "Accessible Forest",
          type: "healing_forest",
          accessibility: {
            wheelchair: true,
            stroller: true,
            parking: true,
            restroom: true,
            elevator: true,
            helpdog: true,
          },
          trails: [
            { name: "Barrier-free loop", distanceKm: 1, difficulty: "easy", estimatedMinutes: 30 },
          ],
          programs: ["meditation"],
        }),
      ],
      profile: beginnerWheelchairProfile,
    });

    const recommendation = buildBaseRecommendationFromFacility(candidate, {
      now: new Date("2026-05-21T00:00:00.000Z"),
    });

    expect(recommendation).toMatchObject({
      id: "rec-accessible-1779321600000",
      facility: {
        id: "accessible",
        name: "Accessible Forest",
        type: "healing_forest",
        matchScore: candidate.score,
      },
      program: {
        totalDurationMinutes: 60,
      },
    });
    expect(recommendation.program.schedule[0]).toMatchObject({
      order: 1,
      type: "walking",
      durationMinutes: 30,
    });
    expect(recommendation.facility.matchReason).toContain("접근성");
    expect(recommendation.nearby).toEqual([]);
  });
});
