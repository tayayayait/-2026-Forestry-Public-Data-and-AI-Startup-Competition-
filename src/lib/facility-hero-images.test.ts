import { describe, expect, it } from "vitest";

import { selectFacilityHeroImageUrls } from "./facility-hero-images";
import type { PhotoGalleryData } from "@/types";

const photoGallery: PhotoGalleryData = {
  scenery: [{ url: "https://images.test/scenery.jpg", category: "scenery" }],
  facility: [{ url: "https://images.test/facility.jpg", category: "facility" }],
  experience: [{ url: "https://images.test/experience.jpg", category: "experience" }],
  etc: [{ url: "https://images.test/etc.jpg", category: "etc" }],
  all: [],
};

describe("selectFacilityHeroImageUrls", () => {
  it("uses facility and experience images as kids forest hero fallbacks", () => {
    expect(selectFacilityHeroImageUrls("kids_forest", photoGallery)).toEqual([
      "https://images.test/scenery.jpg",
      "https://images.test/facility.jpg",
      "https://images.test/experience.jpg",
    ]);
  });

  it("keeps non-kids facility heroes restricted to scenery images", () => {
    expect(selectFacilityHeroImageUrls("recreation_forest", photoGallery)).toEqual([
      "https://images.test/scenery.jpg",
    ]);
  });
});
