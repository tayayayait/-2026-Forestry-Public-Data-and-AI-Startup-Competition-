import { describe, expect, it } from "vitest";
import { getRenderablePhotoGallery } from "@/components/forest/PhotoGallerySection";
import type { PhotoGalleryData } from "@/types";

describe("PhotoGallerySection renderable gallery filtering", () => {
  it("removes empty, duplicate, and failed photo URLs before layout", () => {
    const gallery: PhotoGalleryData = {
      scenery: [],
      facility: [],
      experience: [],
      etc: [],
      all: [
        { url: "", category: "etc", source: "tourapi" },
        { url: "  https://example.com/forest.jpg  ", category: "scenery", source: "tourapi" },
        { url: "https://example.com/missing.jpg", category: "facility", source: "naver" },
        { url: "https://example.com/forest.jpg", category: "scenery", source: "kakao" },
      ],
    };

    const result = getRenderablePhotoGallery(gallery, new Set(["https://example.com/missing.jpg"]));

    expect(result.all.map((image) => image.url)).toEqual(["https://example.com/forest.jpg"]);
    expect(result.scenery).toHaveLength(1);
    expect(result.facility).toHaveLength(0);
    expect(result.etc).toHaveLength(0);
  });

  it("uses category arrays when the all array is empty", () => {
    const gallery: PhotoGalleryData = {
      scenery: [{ url: "https://example.com/scenery.jpg", category: "scenery" }],
      facility: [{ url: "   ", category: "facility" }],
      experience: [],
      etc: [],
      all: [],
    };

    const result = getRenderablePhotoGallery(gallery);

    expect(result.all.map((image) => image.url)).toEqual(["https://example.com/scenery.jpg"]);
    expect(result.scenery).toHaveLength(1);
    expect(result.facility).toHaveLength(0);
  });
});
