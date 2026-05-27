import type { FacilityType, PhotoCategory, PhotoGalleryData } from "@/types";

const KIDS_FOREST_HERO_CATEGORIES: PhotoCategory[] = [
  "scenery",
  "facility",
  "experience",
  "etc",
];
const DEFAULT_HERO_CATEGORIES: PhotoCategory[] = ["scenery"];

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.flatMap((url) => {
    const cleaned = url.trim();
    if (!cleaned || seen.has(cleaned)) return [];
    seen.add(cleaned);
    return [cleaned];
  });
}

export function selectFacilityHeroImageUrls(
  facilityType: FacilityType,
  photoGallery: PhotoGalleryData | undefined,
  limit = 3,
): string[] {
  if (!photoGallery) return [];

  const categories =
    facilityType === "kids_forest" ? KIDS_FOREST_HERO_CATEGORIES : DEFAULT_HERO_CATEGORIES;
  const urls = categories.flatMap((category) => photoGallery[category].map((image) => image.url));

  return uniqueUrls(urls).slice(0, limit);
}
