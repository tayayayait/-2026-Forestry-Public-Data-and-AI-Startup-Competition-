interface KakaoImageDocument {
  collection: string;
  thumbnail_url: string;
  image_url: string;
  width: number;
  height: number;
  display_sitename: string;
  doc_url: string;
  datetime: string;
}

interface KakaoImageSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoImageDocument[];
}

export async function searchKakaoImage(keyword: string): Promise<string[]> {
  const kakaoApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

  if (!kakaoApiKey) {
    console.warn("Kakao REST API Key is missing. Skipping image search.");
    return [];
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(keyword)}&size=3`,
      {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Kakao API error", await response.text());
      return [];
    }

    const data = (await response.json()) as KakaoImageSearchResponse;
    return data.documents.map((doc) => doc.image_url);
  } catch (error) {
    console.error("Failed to fetch kakao image", error);
    return [];
  }
}

/**
 * 카테고리별 키워드 확장 검색.
 * TourAPI 이미지가 부족할 때 폴백으로 사용합니다.
 */
export async function searchCategorizedKakaoImages(facilityName: string): Promise<
  Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    category: "scenery" | "facility" | "experience";
    source: "kakao";
  }>
> {
  const kakaoApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!kakaoApiKey) return [];

  const queries: Array<{
    keyword: string;
    category: "scenery" | "facility" | "experience";
  }> = [
    { keyword: facilityName, category: "scenery" },
    { keyword: facilityName, category: "facility" },
    { keyword: facilityName, category: "experience" },
  ];

  try {
    const results = await Promise.all(
      queries.map(async ({ keyword, category }) => {
        const response = await fetch(
          `https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(keyword)}&size=4`,
          { headers: { Authorization: `KakaoAK ${kakaoApiKey}` } },
        );

        if (!response.ok) return [];

        const data = (await response.json()) as KakaoImageSearchResponse;
        return data.documents.map((doc) => ({
          url: doc.image_url,
          thumbnailUrl: doc.thumbnail_url,
          caption: undefined as string | undefined,
          category,
          source: "kakao" as const,
        }));
      }),
    );

    return results.flat();
  } catch (error) {
    console.error("Failed to fetch categorized kakao images", error);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// 카카오 모빌리티 길찾기 API
// ──────────────────────────────────────────────────────────────

export interface DrivingRouteGuide {
  lat: number;
  lng: number;
  distance: number; // 안내 지점까지의 거리
  guidance: string; // 안내 텍스트 (예: 우회전, 지하차도 진입)
  type: number;
}

export interface DrivingRouteResult {
  distance: number; // 미터
  duration: number; // 초
  taxiFare: number; // 원
  tollFare: number; // 원
  path: Array<{ lat: number; lng: number }>; // 네이버 지도로 그리기 위한 경로 배열
  guides: DrivingRouteGuide[]; // 턴바이턴 안내 정보
}

export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<DrivingRouteResult | null> {
  const kakaoApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

  if (!kakaoApiKey) {
    console.warn("Kakao REST API Key is missing. Skipping driving route fetch.");
    return null;
  }

  try {
    // Kakao Mobility API는 origin과 destination을 "경도,위도" (lng,lat) 순서로 받습니다.
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&priority=RECOMMEND`;

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${kakaoApiKey}`,
      },
    });

    if (!response.ok) {
      console.error("Kakao Mobility API error", await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];

    // 길찾기 실패(예: 너무 멀거나 길이 없는 경우) 처리
    if (route.result_code !== 0) {
      console.warn("Kakao Mobility API returned error:", route.result_code, route.result_msg);
      return null;
    }

    const summary = route.summary;
    if (!summary) return null;

    // 경로(Polyline) 파싱
    // sections > roads > vertexes (x, y, x, y ...)
    const path: Array<{ lat: number; lng: number }> = [];
    const guides: DrivingRouteGuide[] = [];

    if (route.sections) {
      for (const section of route.sections) {
        if (section.roads) {
          for (const road of section.roads) {
            const vertexes = road.vertexes;
            // vertexes는 [lng, lat, lng, lat, ...] 형태의 1차원 배열입니다.
            for (let i = 0; i < vertexes.length; i += 2) {
              path.push({
                lng: vertexes[i],
                lat: vertexes[i + 1],
              });
            }
          }
        }

        // 턴바이턴 안내(Guides) 파싱
        if (section.guides) {
          for (const guide of section.guides) {
            guides.push({
              lat: guide.y,
              lng: guide.x,
              distance: guide.distance,
              guidance: guide.guidance,
              type: guide.type,
            });
          }
        }
      }
    }

    return {
      distance: summary.distance,
      duration: summary.duration,
      taxiFare: summary.fare?.taxi ?? 0,
      tollFare: summary.fare?.toll ?? 0,
      path,
      guides,
    };
  } catch (error) {
    console.error("Failed to fetch driving route", error);
    return null;
  }
}
