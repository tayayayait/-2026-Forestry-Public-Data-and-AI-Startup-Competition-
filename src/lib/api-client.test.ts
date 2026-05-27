import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./api-client";
import { getMockRecommendation } from "./mock-data";
import type {
  AirQualityData,
  ApiResponse,
  CategorizedImage,
  FacilityInfo,
  FacilityHomepageAnalysis,
  ForestPlantImageList,
  ForestPlantStoryList,
  ForestEducationProgramList,
  HealingForestList,
  NearbyPlace,
  RecommendationResult,
  RecreationForestList,
  SurveyAnswers,
  UVIndexData,
  WeatherData,
} from "@/types";

const weather: WeatherData = {
  temperature: 22,
  minTemp: 15,
  maxTemp: 26,
  sky: "맑음",
  precipitationType: "없음",
  precipitationProbability: 10,
  humidity: 55,
  windSpeed: 3.2,
};

describe("apiClient.getWeather", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local weather proxy instead of returning mock data directly", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: weather,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getWeather(37.5665, 126.978);

    expect(fetchSpy).toHaveBeenCalledWith("/api/weather?lat=37.5665&lng=126.978");
    expect(response).toEqual({
      success: true,
      data: weather,
      cached: false,
    });
  });
});

const uvIndex: UVIndexData = {
  areaNo: "1100000000",
  areaName: "서울특별시",
  date: "2026052106",
  uvIndex: 5,
  uvLevel: "보통",
  forecastHour: 0,
};

describe("apiClient.getUvIndex", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local UV index proxy", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: uvIndex,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getUvIndex(37.5665, 126.978);

    expect(fetchSpy).toHaveBeenCalledWith("/api/uv-index?lat=37.5665&lng=126.978");
    expect(response).toEqual({
      success: true,
      data: uvIndex,
      cached: false,
    });
  });
});

const airQuality: AirQualityData = {
  dataTime: "2026-05-21 15:00",
  pm10Value: 35,
  pm25Value: 18,
  o3Value: 0.043,
  khaiValue: 52,
  khaiGrade: 2,
  pm10Grade: 2,
  pm25Grade: 1,
  stationName: "종로구",
};

describe("apiClient.getAirQuality", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local AirKorea proxy instead of returning mock data directly", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: airQuality,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getAirQuality(37.5665, 126.978);

    expect(fetchSpy).toHaveBeenCalledWith("/api/air-quality?lat=37.5665&lng=126.978");
    expect(response).toEqual({
      success: true,
      data: airQuality,
      cached: false,
    });
  });
});

const forestEducationPrograms: ForestEducationProgramList = {
  resultCode: "00",
  resultMsg: "NORMAL SERVICE.",
  pageNo: 1,
  numOfRows: 10,
  totalCount: 1,
  items: [
    {
      title: "숲해설 프로그램",
      content: "내용",
      facilityName: "국립숲체원",
      address: "강원특별자치도",
      tel: "033-000-0000",
    },
  ],
};

describe("apiClient.getForestEducationPrograms", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("requests the local Forest Service education proxy", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: forestEducationPrograms,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getForestEducationPrograms({
      eduType: "1",
      searchTitl: "숲",
      pageNo: 1,
      numOfRows: 10,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/forest-education-programs?eduType=1&searchTitl=%EC%88%B2&pageNo=1&numOfRows=10",
    );
    expect(response).toEqual({
      success: true,
      data: forestEducationPrograms,
      cached: false,
    });
  });

  it("returns an error instead of waiting indefinitely when a forest education request times out", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const responsePromise = apiClient.getForestEducationPrograms(
      {
        eduType: "4",
        pageNo: 1,
        numOfRows: 10,
      },
      { timeoutMs: 50 },
    );
    const timedResponse = Promise.race([
      responsePromise,
      new Promise<"test-timeout">((resolve) => setTimeout(() => resolve("test-timeout"), 100)),
    ]);

    await vi.advanceTimersByTimeAsync(100);

    await expect(timedResponse).resolves.toMatchObject({
      success: false,
      data: null,
      error: "산림교육프로그램 요청 시간이 초과되었습니다.",
    });
  });
});

const recreationForests: RecreationForestList = {
  resultCode: "00",
  resultMsg: "NORMAL_CODE",
  pageNo: 1,
  numOfRows: 10,
  totalCount: 1,
  items: [
    {
      name: "Test Forest",
      provinceName: "Gangwon",
      capacity: null,
      stayingAvailable: null,
      roadAddress: "1 Forest Road",
      latitude: 37.1234,
      longitude: 128.1234,
    },
  ],
};

describe("apiClient.getRecreationForests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local recreation forest proxy", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: recreationForests,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getRecreationForests({
      ctprvnNm: "Gangwon",
      stayngPosblYn: "Y",
      pageNo: 1,
      numOfRows: 10,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/recreation-forests?ctprvnNm=Gangwon&stayngPosblYn=Y&pageNo=1&numOfRows=10",
    );
    expect(response).toEqual({
      success: true,
      data: recreationForests,
      cached: false,
    });
  });
});

const healingForests: HealingForestList = {
  page: 1,
  perPage: 10,
  totalCount: 33,
  currentCount: 1,
  matchCount: 33,
  items: [
    {
      serialNumber: 1,
      region: "강원",
      facilityName: "국립대관령치유의숲",
      address: "강원특별자치도 강릉시 성산면 대관령옛길 127-42",
    },
  ],
};

const staticNationalArboretum: FacilityInfo = {
  id: "arboretum-1",
  name: "국립수목원",
  type: "arboretum",
  address: "경기도 포천시 소홀읍 광릉 수목원로 509",
  lat: 37.754518,
  lng: 127.165883,
  tel: "031-540-2000",
  homepage: "http://www.forest.go.kr/newkfsweb/kfs/idx/SubIndex.do?orgId=kna&mn=KFS_15",
  programs: ["수목원", "국립"],
  trails: [],
  accessibility: {
    wheelchair: false,
    stroller: false,
    parking: false,
    restroom: false,
    elevator: false,
    helpdog: false,
  },
  detailSections: [
    {
      title: "운영 정보",
      items: [
        {
          label: "홈페이지",
          value: "http://www.forest.go.kr/newkfsweb/kfs/idx/SubIndex.do?orgId=kna&mn=KFS_15",
        },
      ],
    },
  ],
};

describe("apiClient.getHealingForests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local healing forest proxy", async () => {
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: healingForests,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getHealingForests({
      page: 1,
      perPage: 10,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/healing-forests?page=1&perPage=10");
    expect(response).toEqual({
      success: true,
      data: healingForests,
      cached: false,
    });
  });
});

describe("apiClient.getFacilities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the healing forest proxy and merges local shapefile coordinates", async () => {
    const healingForestResponse: ApiResponse<HealingForestList> = {
      success: true,
      data: {
        page: 1,
        perPage: 100,
        totalCount: 1,
        currentCount: 1,
        matchCount: 1,
        items: [
          {
            serialNumber: 1,
            region: "경기도",
            facilityName: "산음 치유의 숲",
            address: "경기도 양평군 단월면 고북길 347",
            telephoneNumber: "031-774-7687",
            homepage: "https://cafe.naver.com/saneumhealing",
          },
        ],
      },
      cached: false,
    };
    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.startsWith("/api/healing-forests")) return Response.json(healingForestResponse);
      if (url.startsWith("/api/recreation-forests")) {
        return Response.json(
          { success: false, data: null, error: "recreation failed" },
          { status: 502 },
        );
      }
      if (url === "/data/static-forest-location-facilities.json") return Response.json([]);
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getFacilities();

    expect(
      fetchSpy.mock.calls.some(([url]) => url === "/api/healing-forests?page=1&perPage=100"),
    ).toBe(true);
    expect(response.success).toBe(true);
    expect((response.data as FacilityInfo[])[0]).toMatchObject({
      id: "healing-forest-1",
      name: "산음 치유의 숲",
      type: "healing_forest",
      lat: 37.60455927717994,
      lng: 127.5784207834287,
    });
  });

  it("adds coordinate-backed recreation forests without forest education enrichment", async () => {
    const recreationForestResponse: ApiResponse<RecreationForestList> = {
      success: true,
      data: recreationForests,
      cached: false,
    };
    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.startsWith("/api/healing-forests")) {
        return Response.json(
          { success: false, data: null, error: "healing failed" },
          { status: 502 },
        );
      }
      if (url.startsWith("/api/recreation-forests")) {
        return Response.json(recreationForestResponse);
      }
      if (url === "/data/static-forest-location-facilities.json") {
        return Response.json([]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getFacilities();

    expect(
      fetchSpy.mock.calls.some(
        ([url]) => url === "/api/recreation-forests?pageNo=1&numOfRows=1000",
      ),
    ).toBe(true);
    expect(
      fetchSpy.mock.calls.some(([url]) => `${url}`.startsWith("/api/forest-education-programs")),
    ).toBe(false);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "recreation-forest-testforest",
          name: "Test Forest",
          type: "recreation_forest",
          educationPrograms: [],
        }),
      ]),
    );
  });

  it("normalizes stale homepage URLs across fallback facility sources", async () => {
    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.startsWith("/api/healing-forests")) {
        return Response.json(
          { success: false, data: null, error: "healing failed" },
          { status: 502 },
        );
      }
      if (url.startsWith("/api/recreation-forests")) {
        return Response.json(
          { success: false, data: null, error: "recreation failed" },
          { status: 502 },
        );
      }
      if (url === "/data/static-forest-location-facilities.json") {
        return Response.json([staticNationalArboretum]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getFacilities();
    const facilities = response.data as FacilityInfo[];
    const nationalArboretum = facilities.find((facility) => facility.id === "arboretum-1");

    expect(nationalArboretum?.homepage).toBe("https://kna.forest.go.kr/");
    expect(
      nationalArboretum?.detailSections
        ?.flatMap((section) => section.items)
        .some((item) => item.value === "https://kna.forest.go.kr/"),
    ).toBe(true);
  });
});

describe("apiClient.getPlants", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local forest plant proxy and maps results to PlantInfo", async () => {
    const plantResponse: ApiResponse<ForestPlantStoryList> = {
      success: true,
      data: {
        resultCode: "00",
        resultMsg: "NORMAL SERVICE.",
        pageNo: 1,
        numOfRows: 1,
        totalCount: 1,
        items: [
          {
            id: "1",
            name: "가래나무",
            scientificName: "Juglans mandshurica Maxim.",
            guide: "쌍떡잎식물 가래나무목 : 가래나무과의 낙엽활엽 교목",
            habitat: "깊은 산속",
            story: "간혹 산에 가면 잎 달린 줄기들이 쭉쭉 올라간다.",
          },
        ],
      },
      cached: false,
    };
    const fetchSpy = vi.fn(async () => Response.json(plantResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getPlants("가래나무");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/forest-plants?pageNo=1&numOfRows=10&searchWrd=%EA%B0%80%EB%9E%98%EB%82%98%EB%AC%B4",
    );
    expect(response).toEqual({
      success: true,
      data: [
        {
          id: "forest-plant-1",
          name: "가래나무",
          scientificName: "Juglans mandshurica Maxim.",
          description: "간혹 산에 가면 잎 달린 줄기들이 쭉쭉 올라간다.",
          usage: "쌍떡잎식물 가래나무목 : 가래나무과의 낙엽활엽 교목",
          habitat: "깊은 산속",
        },
      ],
      cached: false,
    });
  });
});

describe("apiClient.getPlantImages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("requests the local forest plant image proxy with the story id", async () => {
    const imageResponse: ApiResponse<ForestPlantImageList> = {
      success: true,
      data: {
        resultCode: "00",
        resultMsg: "NORMAL SERVICE.",
        pageNo: 1,
        numOfRows: 2,
        totalCount: 2,
        items: [
          { id: "1", name: "가래나무", fileName: "mok2-2.jpg" },
          { id: "2", name: "가래나무", fileName: "mok1-2.jpg" },
        ],
      },
      cached: false,
    };
    const fetchSpy = vi.fn(async () => Response.json(imageResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getPlantImages("1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/forest-plant-images?searchWrd=1&pageNo=1&numOfRows=10",
    );
    expect(response).toEqual(imageResponse);
  });

  it("returns an error instead of waiting indefinitely when a plant image request times out", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const responsePromise = apiClient.getPlantImages("1", { timeoutMs: 50 });
    const timedResponse = Promise.race([
      responsePromise,
      new Promise<"test-timeout">((resolve) => setTimeout(() => resolve("test-timeout"), 100)),
    ]);

    await vi.advanceTimersByTimeAsync(100);

    await expect(timedResponse).resolves.toMatchObject({
      success: false,
      data: null,
      error: "식물 이미지 요청 시간이 초과되었습니다.",
    });
  });
});

describe("apiClient facility image curation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads pinned facility images from the local Supabase-backed curation proxy", async () => {
    const images: CategorizedImage[] = [
      {
        url: "https://images.test/pinned.jpg",
        caption: "Pinned image",
        category: "scenery",
        source: "naver",
      },
    ];
    const apiResponse: ApiResponse<CategorizedImage[]> = {
      success: true,
      data: images,
      cached: true,
    };
    const fetchSpy = vi.fn(async () => Response.json(apiResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getPinnedFacilityImages("healing-forest-busan");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/facility-image-curation?facilityId=healing-forest-busan",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(response).toEqual(apiResponse);
  });

  it("posts facility image candidates to the local Gemini pixel curation proxy", async () => {
    const images: CategorizedImage[] = [
      {
        url: "https://images.test/forest.jpg",
        caption: "시설 전경",
        category: "scenery",
        source: "naver",
      },
    ];
    const apiResponse: ApiResponse<CategorizedImage[]> = {
      success: true,
      data: images,
      cached: false,
    };
    const fetchSpy = vi.fn(async () => Response.json(apiResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.curateFacilityImages(
      "healing-forest-busan",
      "부산 치유의 숲",
      images,
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/facility-image-curation",
      expect.objectContaining({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          facilityId: "healing-forest-busan",
          facilityName: "부산 치유의 숲",
          images,
        }),
      }),
    );
    expect(response).toEqual(apiResponse);
  });
});

describe("apiClient.analyzeFacilityHomepage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts facility homepage analysis requests to the local Gemini proxy", async () => {
    const apiResponse: ApiResponse<FacilityHomepageAnalysis> = {
      success: true,
      data: {
        facilityName: "Test Forest",
        homepageUrl: "https://example.go.kr",
        analyzedAt: "2026-05-25T06:30:00.000Z",
        retrievalStatus: "success",
        sections: [],
        missingSections: [],
        sourceUrls: ["https://example.go.kr"],
      },
      cached: false,
    };
    const fetchSpy = vi.fn(async () => Response.json(apiResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.analyzeFacilityHomepage({
      facilityName: "Test Forest",
      homepageUrl: "https://example.go.kr",
      facilityType: "healing_forest",
      address: "1 Forest Road",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/facility-homepage-analysis",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      facilityName: "Test Forest",
      homepageUrl: "https://example.go.kr",
      facilityType: "healing_forest",
      address: "1 Forest Road",
    });
    expect(response).toEqual(apiResponse);
  });

  it("loads a pinned facility homepage analysis by homepage URL", async () => {
    const apiResponse: ApiResponse<FacilityHomepageAnalysis> = {
      success: true,
      data: {
        facilityName: "Test Forest",
        homepageUrl: "https://example.go.kr/",
        analyzedAt: "2026-05-25T06:30:00.000Z",
        retrievalStatus: "success",
        sections: [],
        missingSections: [],
        sourceUrls: ["https://example.go.kr/"],
      },
      cached: true,
    };
    const fetchSpy = vi.fn(async () => Response.json(apiResponse));
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getPinnedFacilityHomepageAnalysis("https://example.go.kr/");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/facility-homepage-analysis?homepageUrl=https%3A%2F%2Fexample.go.kr%2F",
    );
    expect(response).toEqual(apiResponse);
  });
});

describe("apiClient.getNearbyPlaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the local TourAPI tourism proxy", async () => {
    const places = [
      {
        type: "restaurant" as const,
        name: "Forest Restaurant",
        distance: "900m",
        description: "1 Food Road",
      },
    ];
    const fetchSpy = vi.fn(async () =>
      Response.json({
        success: true,
        data: places,
        cached: false,
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.getNearbyPlaces(37.1234, 128.1234);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/tourism?lat=37.1234&lng=128.1234&radius=20000&limit=8",
    );
    expect(response).toEqual({
      success: true,
      data: places,
      cached: false,
    });
  });
});

describe("apiClient.generateRecommendation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const profile: Partial<SurveyAnswers> = {
    stressLevel: 7,
    sleepQuality: "poor",
    fitnessLevel: "beginner",
    preferredActivities: ["walking"],
    companions: "solo",
    maxTravelTime: 60,
    accessibilityNeeds: ["none"],
  };

  it("requests the local Gemini recommendation proxy before enriching nearby places", async () => {
    const recommendation = getMockRecommendation();
    const nearby: NearbyPlace[] = [
      {
        type: "attraction",
        name: "Accessible Forest Museum",
        distance: "1.2km",
      },
    ];
    const fetchSpy = vi.fn<typeof fetch>(async (input, init) => {
      const url = input.toString();
      if (url === "/api/recommendation") {
        return Response.json({
          success: true,
          data: recommendation,
          cached: false,
        } satisfies ApiResponse<RecommendationResult>);
      }
      if (url.startsWith("/api/tourism?")) {
        return Response.json({
          success: true,
          data: nearby,
          cached: false,
        } satisfies ApiResponse<NearbyPlace[]>);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.generateRecommendation("profile-1", "f-001", profile);

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/recommendation",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toMatchObject({
      profileId: "profile-1",
      facilityId: "f-001",
      profile,
    });
    expect(fetchSpy.mock.calls[1]![0].toString()).toBe(
      `/api/tourism?lat=${recommendation.facility.lat}&lng=${recommendation.facility.lng}&radius=20000&limit=8`,
    );
    expect(response).toMatchObject({
      success: true,
      data: {
        id: recommendation.id,
        nearby,
      },
    });
  });

  it("includes the latest environment snapshot in the recommendation request", async () => {
    const recommendation = getMockRecommendation();
    const fetchSpy = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString();
      if (url === "/api/recommendation") {
        return Response.json({
          success: true,
          data: recommendation,
          cached: false,
        } satisfies ApiResponse<RecommendationResult>);
      }
      if (url.startsWith("/api/tourism?")) {
        return Response.json({
          success: true,
          data: [],
          cached: false,
        } satisfies ApiResponse<NearbyPlace[]>);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    await apiClient.generateRecommendation("profile-1", undefined, profile, {
      weather,
      airQuality,
      uvIndex: 8,
      uvLevel: "매우높음",
    });

    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toMatchObject({
      environment: {
        weather,
        airQuality,
        uvIndex: 8,
        uvLevel: "매우높음",
      },
    });
  });

  it("includes the current user location in the recommendation request", async () => {
    const recommendation = getMockRecommendation();
    const fetchSpy = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString();
      if (url === "/api/recommendation") {
        return Response.json({
          success: true,
          data: recommendation,
          cached: false,
        } satisfies ApiResponse<RecommendationResult>);
      }
      if (url.startsWith("/api/tourism?")) {
        return Response.json({
          success: true,
          data: [],
          cached: false,
        } satisfies ApiResponse<NearbyPlace[]>);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    await apiClient.generateRecommendation("profile-1", undefined, profile, undefined, {
      lat: 37.5665,
      lng: 126.978,
    });

    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toMatchObject({
      location: {
        lat: 37.5665,
        lng: 126.978,
      },
    });
  });

  it("does not hide a failed recommendation proxy response behind local mock data", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString();
      if (url === "/api/recommendation") {
        return Response.json(
          {
            success: false,
            data: null,
            error: "Gemini unavailable.",
          } satisfies ApiResponse<RecommendationResult>,
          { status: 502 },
        );
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await apiClient.generateRecommendation("profile-1", "f-001", profile);

    expect(response).toEqual({
      success: false,
      data: null,
      error: "Gemini unavailable.",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
