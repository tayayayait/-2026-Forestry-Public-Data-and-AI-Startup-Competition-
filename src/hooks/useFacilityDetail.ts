import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CategorizedImage,
  FacilityFullDetail,
  FacilityInfo,
  PhotoGalleryData,
  WaypointInfo,
} from "@/types";
import type { TourFacilityDetail, TourSearchResult } from "@/lib/tourapi-detail";
import { searchCategorizedKakaoImages } from "@/lib/kakao-api";
import { buildPhotoGallery } from "@/lib/categorize-images";
import { buildFacilityImageSearchQueries } from "@/lib/kids-forest-image-search";
import { COMMON_TIPS, FACILITY_TYPE_TIPS, DEFAULT_TIP } from "@/constants/facility-tips";
import { getFacilityUsageOverride } from "@/lib/facility-usage-override";

/** Gemini 큐레이션 실패 시에도 fallback 이미지를 서버에 영구 저장 */
function pinFallbackImages(
  facility: Pick<FacilityInfo, "id" | "name">,
  images: CategorizedImage[],
): void {
  if (images.length === 0) return;
  // fire-and-forget: 저장 실패해도 현재 응답에 영향 없음
  apiClient
    .curateFacilityImages(facility.id, facility.name, images)
    .catch(() => {});
}

const TARGET_IMAGE_COUNT = 15;

const EMPTY_PHOTO_GALLERY: PhotoGalleryData = {
  scenery: [],
  facility: [],
  experience: [],
  etc: [],
  all: [],
};

type FacilityIdentity = Pick<FacilityInfo, "id" | "name">;

type ImageSearchResult = {
  naverImages: CategorizedImage[];
  kakaoImages: Awaited<ReturnType<typeof searchCategorizedKakaoImages>>;
};

export function buildFacilityImageSearchQuery(
  facility: Pick<FacilityInfo, "name" | "type">,
): string {
  return buildFacilityImageSearchQueries({ ...facility, address: "" })[0] ?? facility.name.trim();
}

function normalizeCategory(value: unknown): CategorizedImage["category"] {
  return value === "scenery" || value === "facility" || value === "experience" || value === "etc"
    ? value
    : "etc";
}

function normalizeNaverImages(
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    category: string;
    source: string;
  }>,
): CategorizedImage[] {
  return images.map((img) => ({
    url: img.url,
    thumbnailUrl: img.thumbnailUrl,
    caption: img.caption,
    category: normalizeCategory(img.category),
    source: img.source === "naver-official" ? "naver-official" : "naver",
  }));
}

async function searchFacilityImages(
  facility: FacilityInfo,
  queries: string[],
): Promise<ImageSearchResult> {
  let naverImages: CategorizedImage[] = [];

  for (const query of queries) {
    if (naverImages.length >= TARGET_IMAGE_COUNT) break;

    try {
      const naverResult = await apiClient.searchNaverImages(
        query,
        facility.type ?? "recreation_forest",
        TARGET_IMAGE_COUNT - naverImages.length,
      );
      if (naverResult.success && naverResult.data) {
        const existingUrls = new Set(naverImages.map((image) => image.url));
        naverImages = [
          ...naverImages,
          ...normalizeNaverImages(naverResult.data).filter((image) => !existingUrls.has(image.url)),
        ];
      }
    } catch {
      // Naver failure is non-fatal because Kakao is the secondary image source.
    }
  }

  const kakaoImages =
    naverImages.length < TARGET_IMAGE_COUNT
      ? await searchCategorizedKakaoImages(queries[0] ?? facility.name)
      : [];

  return { naverImages, kakaoImages };
}

function groupCuratedPhotoGallery(
  baseGallery: PhotoGalleryData,
  curatedImages: CategorizedImage[],
): PhotoGalleryData {
  return {
    ...baseGallery,
    all: curatedImages,
    scenery: curatedImages.filter((img) => img.category === "scenery"),
    facility: curatedImages.filter((img) => img.category === "facility"),
    experience: curatedImages.filter((img) => img.category === "experience"),
    etc: curatedImages.filter((img) => img.category === "etc"),
  };
}

function buildPhotoGalleryFromImages(images: CategorizedImage[]): PhotoGalleryData {
  return groupCuratedPhotoGallery(EMPTY_PHOTO_GALLERY, images);
}

async function curatePhotoGalleryWithGemini(
  facility: FacilityIdentity,
  photoGallery: PhotoGalleryData,
): Promise<{ photoGallery: PhotoGalleryData; images: string[]; usedCuration: boolean }> {
  if (photoGallery.all.length <= 1) {
    return {
      photoGallery,
      images: photoGallery.all.map((img) => img.url),
      usedCuration: false,
    };
  }

  const curationResult = await apiClient.curateFacilityImages(
    facility.id,
    facility.name,
    photoGallery.all,
  );
  const usedCuration =
    curationResult.success && Array.isArray(curationResult.data) && !curationResult.error;
  const curatedImages = usedCuration ? (curationResult.data ?? []) : photoGallery.all;

  return {
    photoGallery: groupCuratedPhotoGallery(photoGallery, curatedImages),
    images: curatedImages.map((img) => img.url),
    usedCuration,
  };
}

async function loadPinnedPhotoGallery(
  facility: FacilityIdentity,
): Promise<{ photoGallery: PhotoGalleryData; images: string[] } | null> {
  const pinnedResult = await apiClient.getPinnedFacilityImages(facility.id);
  if (
    !pinnedResult.success ||
    !Array.isArray(pinnedResult.data) ||
    pinnedResult.data.length === 0
  ) {
    return null;
  }

  return {
    photoGallery: buildPhotoGalleryFromImages(pinnedResult.data),
    images: pinnedResult.data.map((image) => image.url),
  };
}

export function buildPinnedFacilityDetail(
  facility: FacilityInfo,
  pinnedGallery: { photoGallery: PhotoGalleryData; images: string[] },
): FacilityFullDetail {
  return {
    overview: facility.intro,
    images: pinnedGallery.images,
    photoGallery: pinnedGallery.photoGallery,
    waypoints: [],
    tips: generateDefaultTips(facility),
    transport: undefined,
  };
}

function buildWaypoints(detail: TourFacilityDetail) {
  return (detail.infoItems ?? []).map((item) => ({
    order: item.subNum,
    name: item.subName,
    description: item.subDetailOverview,
    imageUrl: item.subDetailImg,
  }));
}

function buildTransport(detail: TourFacilityDetail): FacilityFullDetail["transport"] {
  return detail.intro
    ? {
        publicTransport: undefined,
        selfDriving: undefined,
        parking: detail.intro.parking,
        infoCenter: detail.intro.infoCenter,
      }
    : undefined;
}

function buildUsageInfo(detail: TourFacilityDetail, facility: FacilityInfo): FacilityFullDetail["usageInfo"] {
  const override = getFacilityUsageOverride(facility);
  const base = detail.intro
    ? {
        useTime: detail.intro.useTime,
        useFee: detail.intro.useFee,
        restDate: detail.intro.restDate,
        infoCenter: detail.intro.infoCenter,
      }
    : undefined;

  if (!base && !override) return undefined;
  return { ...base, ...override };
}

function buildFallbackImageUrls(result: ImageSearchResult): string[] {
  return [...result.naverImages.map((img) => img.url), ...result.kakaoImages.map((img) => img.url)];
}

async function buildCuratedGalleryFromSearch(
  facility: FacilityInfo,
  queries: string[],
  waypoints: WaypointInfo[] = [],
) {
  const searchResult = await searchFacilityImages(facility, queries);
  const photoGallery = buildPhotoGallery(
    [],
    waypoints,
    searchResult.naverImages.length > 0 ? searchResult.naverImages : undefined,
    searchResult.kakaoImages.length > 0 ? searchResult.kakaoImages : undefined,
  );
  const curated = await curatePhotoGalleryWithGemini(facility, photoGallery);

  return {
    searchResult,
    curated,
  };
}

function findFacilityMatch(
  searchData: TourSearchResult[] | null | undefined,
  facilityName: string,
): TourSearchResult | null {
  const sanitize = (str: string) => str.replace(/\s+/g, "").toLowerCase();
  const facilityNameSanitized = sanitize(facilityName);
  const facilityMatch = searchData?.filter((result) => result.contentTypeId !== "25");

  return (
    facilityMatch?.find(
      (result) =>
        sanitize(result.title).includes(facilityNameSanitized) ||
        facilityNameSanitized.includes(sanitize(result.title)),
    ) ?? null
  );
}

export function useFacilityDetail(facility: FacilityInfo | undefined) {
  return useQuery({
    queryKey: ["facility-detail", facility?.id],
    queryFn: async (): Promise<FacilityFullDetail> => {
      if (!facility) throw new Error("Facility is required.");

      const pinnedGallery = await loadPinnedPhotoGallery(facility);
      if (pinnedGallery) {
        return buildPinnedFacilityDetail(facility, pinnedGallery);
      }

      const searchResult = await apiClient.searchTourContent(facility.name);
      const searchData = searchResult.data as TourSearchResult[] | null;
      const matched = findFacilityMatch(searchData, facility.name);
      const imageSearchQueries = buildFacilityImageSearchQueries(facility);

      if (!matched?.contentId) {
        const { searchResult: imageSearchResult, curated } = await buildCuratedGalleryFromSearch(
          facility,
          imageSearchQueries,
        );
        const fallbackImages = buildFallbackImageUrls(imageSearchResult);
        const allImages = facility.imageUrl
          ? [facility.imageUrl, ...fallbackImages]
          : fallbackImages;

        const finalImages = curated.usedCuration ? curated.images : allImages;
        // 큐레이션 실패해도 fallback 이미지를 서버에 저장 → 다음 방문자부터 즉시 로드
        if (!curated.usedCuration && finalImages.length > 0) {
          pinFallbackImages(facility, finalImages.map((url) => ({ url, category: "etc" as const, source: "fallback" })));
        }

        return {
          overview: facility.intro,
          images: finalImages,
          photoGallery: curated.photoGallery,
          waypoints: [],
          tips: generateDefaultTips(facility),
          transport: undefined,
        };
      }

      const detailResult = await apiClient.getTourDetail(matched.contentId, matched.contentTypeId);
      const detail = detailResult.data as TourFacilityDetail | null;

      if (!detail) {
        const { searchResult: imageSearchResult, curated } = await buildCuratedGalleryFromSearch(
          facility,
          imageSearchQueries,
        );
        const fallbackImages = buildFallbackImageUrls(imageSearchResult);

        const finalImages = curated.usedCuration
          ? curated.images
          : matched.firstImage
            ? [matched.firstImage, ...fallbackImages]
            : fallbackImages;
        if (!curated.usedCuration && finalImages.length > 0) {
          pinFallbackImages(facility, finalImages.map((url) => ({ url, category: "etc" as const, source: "fallback" })));
        }

        return {
          contentId: matched.contentId,
          overview: facility.intro,
          images: finalImages,
          photoGallery: curated.photoGallery,
          waypoints: [],
          tips: generateDefaultTips(facility),
          transport: undefined,
        };
      }

      const waypoints = buildWaypoints(detail);

      const { searchResult: imageSearchResult, curated } = await buildCuratedGalleryFromSearch(
        facility,
        imageSearchQueries,
        waypoints,
      );
      const fallbackImages =
        imageSearchResult.naverImages.length > 0
          ? imageSearchResult.naverImages.map((img) => img.url)
          : imageSearchResult.kakaoImages.map((img) => img.url);

      const finalImages = curated.usedCuration ? curated.images : fallbackImages;
      if (!curated.usedCuration && finalImages.length > 0) {
        pinFallbackImages(facility, finalImages.map((url) => ({ url, category: "etc" as const, source: "fallback" })));
      }

      return {
        contentId: matched.contentId,
        overview: detail.common?.overview ?? facility.intro,
        images: finalImages,
        imageDetails: [],
        photoGallery: curated.photoGallery,
        transport: buildTransport(detail),
        usageInfo: buildUsageInfo(detail, facility),
        waypoints,
        tips: generateDefaultTips(facility),
        courseDistance: detail.intro?.distance,
        courseTime: detail.intro?.taketime,
        courseTheme: detail.intro?.theme,
      };
    },
    enabled: !!facility,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

function generateDefaultTips(facility: FacilityInfo): string[] {
  const tips: string[] = [...COMMON_TIPS];

  if (facility.type && FACILITY_TYPE_TIPS[facility.type]) {
    tips.push(...(FACILITY_TYPE_TIPS[facility.type] ?? []));
  } else {
    tips.push(DEFAULT_TIP);
  }

  return tips;
}
