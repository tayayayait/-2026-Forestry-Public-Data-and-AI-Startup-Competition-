import { describe, expect, it } from "vitest";

import { createLocalHealthProfile } from "./useHealthProfile";

describe("createLocalHealthProfile", () => {
  it("creates a local health profile from complete survey answers", () => {
    const now = new Date("2026-05-23T01:00:00.000Z");

    const profile = createLocalHealthProfile(
      {
        stressLevel: 7,
        sleepQuality: "normal",
        fitnessLevel: "beginner",
        preferredActivities: ["walking"],
        companions: "solo",
        maxTravelTime: 60,
        accessibilityNeeds: ["none"],
      },
      now,
    );

    expect(profile).toMatchObject({
      id: "local-health-profile",
      userId: "local-user",
      stressLevel: 7,
      sleepQuality: "normal",
      fitnessLevel: "beginner",
      preferredActivities: ["walking"],
      companions: "solo",
      maxTravelTime: 60,
      accessibilityNeeds: ["none"],
    });
    expect(profile?.createdAt).toEqual(now);
    expect(profile?.updatedAt).toEqual(now);
  });

  it("rejects incomplete survey answers", () => {
    expect(createLocalHealthProfile({ stressLevel: 7 })).toBeNull();
  });
});
