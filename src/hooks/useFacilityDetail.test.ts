import { describe, expect, it } from "vitest";

import { buildFacilityImageSearchQuery, buildPinnedFacilityDetail } from "./useFacilityDetail";
import type { FacilityInfo, PhotoGalleryData } from "@/types";

const accessibility = {
  wheelchair: false,
  stroller: false,
  parking: false,
  restroom: false,
  elevator: false,
  helpdog: false,
};

describe("buildFacilityImageSearchQuery", () => {
  it("uses only the facility name so regional news terms do not pollute image search", () => {
    const facility = {
      id: "healing-forest-busan",
      name: "부산 치유의 숲",
      type: "healing_forest",
      address: "부산광역시 기장군 철마면 철마천로 101",
      lat: 35.0,
      lng: 129.0,
      programs: [],
      trails: [],
      accessibility,
    } satisfies FacilityInfo;

    expect(buildFacilityImageSearchQuery(facility)).toBe("부산 치유의 숲");
  });
});

describe("buildPinnedFacilityDetail", () => {
  it("builds a renderable detail payload from Supabase-pinned images without TourAPI fields", () => {
    const facility = {
      id: "healing-forest-busan",
      name: "부산 치유의 숲",
      type: "healing_forest",
      address: "부산광역시 기장군 철마면 철마천로 101",
      lat: 35.0,
      lng: 129.0,
      intro: "공공데이터 시설 소개",
      programs: [],
      trails: [],
      accessibility,
    } satisfies FacilityInfo;
    const photoGallery: PhotoGalleryData = {
      scenery: [
        {
          url: "https://images.test/busan-healing-forest.jpg",
          category: "scenery",
          source: "naver",
        },
      ],
      facility: [],
      experience: [],
      etc: [],
      all: [
        {
          url: "https://images.test/busan-healing-forest.jpg",
          category: "scenery",
          source: "naver",
        },
      ],
    };

    const detail = buildPinnedFacilityDetail(facility, {
      photoGallery,
      images: ["https://images.test/busan-healing-forest.jpg"],
    });

    expect(detail).toMatchObject({
      overview: "공공데이터 시설 소개",
      images: ["https://images.test/busan-healing-forest.jpg"],
      photoGallery,
      waypoints: [],
      transport: undefined,
    });
    expect(detail.usageInfo).toBeUndefined();
    expect(detail.contentId).toBeUndefined();
    expect(detail.tips.length).toBeGreaterThan(0);
  });
});
