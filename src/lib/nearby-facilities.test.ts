import { describe, expect, it } from "vitest";

import { getNearbyFacilities, withFacilityTravelEstimates } from "./nearby-facilities";
import type { FacilityInfo } from "@/types";

function facility(
  id: string,
  coords: { lat: number; lng: number },
  overrides: Partial<FacilityInfo> = {},
): FacilityInfo {
  return {
    id,
    name: id,
    type: "healing_forest",
    address: id,
    lat: coords.lat,
    lng: coords.lng,
    programs: [],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: false,
      restroom: false,
      elevator: false,
      helpdog: false,
    },
    ...overrides,
  };
}

describe("getNearbyFacilities", () => {
  it("returns nearest valid facilities for the current user location", () => {
    const facilities = [
      facility("seoul", { lat: 37.5665, lng: 126.978 }),
      facility("jeju", { lat: 33.4996, lng: 126.5312 }),
      facility("busan", { lat: 35.1796, lng: 129.0756 }),
    ];

    const nearby = getNearbyFacilities(facilities, { lat: 33.5, lng: 126.53 }, { limit: 2 });

    expect(nearby.map((item) => item.id)).toEqual(["jeju", "busan"]);
  });

  it("keeps the original order when user coordinates are unavailable", () => {
    const facilities = [
      facility("first", { lat: 37, lng: 127 }),
      facility("second", { lat: 33, lng: 126 }),
    ];

    expect(getNearbyFacilities(facilities, null, { limit: 1 }).map((item) => item.id)).toEqual([
      "first",
    ]);
  });
});

describe("withFacilityTravelEstimates", () => {
  it("adds rough travel minutes from the current user location without mutating source data", () => {
    const facilities = [
      facility("near", { lat: 37.5666, lng: 126.9781 }),
      facility("far", { lat: 35.1796, lng: 129.0756 }),
    ];

    const estimated = withFacilityTravelEstimates(facilities, { lat: 37.5665, lng: 126.978 });

    expect(estimated[0]).toMatchObject({
      id: "near",
      distanceMinutes: expect.any(Number),
    });
    expect(estimated[1]!.distanceMinutes).toBeGreaterThan(estimated[0]!.distanceMinutes!);
    expect(facilities[0]!.distanceMinutes).toBeUndefined();
  });

  it("keeps facilities unchanged when user coordinates are unavailable", () => {
    const facilities = [facility("first", { lat: 37, lng: 127 })];

    expect(withFacilityTravelEstimates(facilities, null)).toEqual(facilities);
  });
});
