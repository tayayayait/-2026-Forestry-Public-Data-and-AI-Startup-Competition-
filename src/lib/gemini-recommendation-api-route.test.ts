import { describe, expect, it, vi } from "vitest";

import { handleRecommendationApiRequest } from "./gemini-recommendation-api-route";

const geminiPayload = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              matchReason: "맞춤형 저강도 회복 코스입니다.",
              program: {
                title: "Gemini 맞춤 코스",
                schedule: [
                  {
                    order: 1,
                    time: "10:00",
                    activity: "숲길 호흡",
                    type: "walking",
                    location: "치유숲길",
                    description: "천천히 걷습니다.",
                    durationMinutes: 30,
                  },
                ],
              },
              expectedEffects: {
                primary: "스트레스 완화",
                secondary: "회복감 향상",
                note: "개인차가 있습니다.",
              },
            }),
          },
        ],
      },
    },
  ],
};

describe("handleRecommendationApiRequest", () => {
  it("returns a Gemini generated recommendation with the configured model", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          facilityId: "f-001",
          profile: {
            stressLevel: 8,
            sleepQuality: "poor",
            fitnessLevel: "beginner",
            preferredActivities: ["walking"],
            companions: "solo",
            maxTravelTime: 60,
            accessibilityNeeds: ["none"],
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        GEMINI_MODEL: "gemini-3-flash-preview",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        program: {
          title: "Gemini 맞춤 코스",
          totalDurationMinutes: 30,
        },
        expectedEffects: {
          primary: "스트레스 완화",
        },
      },
      cached: false,
    });
    expect(
      fetchImpl.mock.calls.some((call) =>
        call[0].toString().includes("gemini-3-flash-preview:generateContent"),
      ),
    ).toBe(true);
  });

  it("builds the base recommendation from scored public facilities instead of mock facilities", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          profile: {
            stressLevel: 9,
            sleepQuality: "poor",
            fitnessLevel: "beginner",
            preferredActivities: ["walking", "meditation"],
            companions: "senior",
            maxTravelTime: 60,
            accessibilityNeeds: ["wheelchair"],
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        GEMINI_MODEL: "gemini-3-flash-preview",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.facility.id).toMatch(/^healing-forest-/);
    expect(payload.data.facility.id).not.toBe("f-001");
    expect(payload.data.facility.matchScore).toBeGreaterThanOrEqual(50);
  });

  it("uses recreation forests as recommendation candidates without forest education enrichment", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString();
      if (url.includes("tn_pubr_public_rcrfrst_api")) {
        return Response.json({
          response: {
            header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
            body: {
              pageNo: 1,
              numOfRows: 1,
              totalCount: 1,
              items: [
                {
                  rcrfrstNm: "체험 휴양림",
                  ctprvnNm: "강원특별자치도",
                  rdnmadr: "강원특별자치도 체험로 1",
                  latitude: 37.1,
                  longitude: 128.1,
                },
              ],
            },
          },
        });
      }
      return Response.json(geminiPayload);
    });

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          profile: {
            stressLevel: 3,
            sleepQuality: "normal",
            fitnessLevel: "moderate",
            preferredActivities: ["experience"],
            companions: "family",
            maxTravelTime: 120,
            accessibilityNeeds: ["none"],
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        PUBLIC_DATA_SERVICE_KEY: "public-key",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(
      fetchImpl.mock.calls.some(([url]) => url.toString().includes("frstEduInfoOpenAPI")),
    ).toBe(false);
    expect(payload.data.facility).toMatchObject({
      id: "recreation-forest-체험휴양림",
      name: "체험 휴양림",
      type: "recreation_forest",
    });
  });

  it("uses the current user location to prefer the reachable public-data candidate", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = input.toString();
      if (url.includes("tn_pubr_public_rcrfrst_api")) {
        return Response.json({
          response: {
            header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
            body: {
              pageNo: 1,
              numOfRows: 2,
              totalCount: 2,
              items: [
                {
                  rcrfrstNm: "A Far Experience Forest",
                  ctprvnNm: "Gangwon",
                  rdnmadr: "1 Far Road",
                  latitude: 38.4,
                  longitude: 128.4,
                },
                {
                  rcrfrstNm: "Z Near Experience Forest",
                  ctprvnNm: "Seoul",
                  rdnmadr: "1 Near Road",
                  latitude: 37.5666,
                  longitude: 126.9781,
                },
              ],
            },
          },
        });
      }
      return Response.json(geminiPayload);
    });

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          location: { lat: 37.5665, lng: 126.978 },
          profile: {
            stressLevel: 3,
            sleepQuality: "normal",
            fitnessLevel: "moderate",
            preferredActivities: ["experience"],
            companions: "solo",
            maxTravelTime: 30,
            accessibilityNeeds: ["none"],
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        PUBLIC_DATA_SERVICE_KEY: "public-key",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.facility).toMatchObject({
      id: "recreation-forest-znearexperienceforest",
      name: "Z Near Experience Forest",
    });
  });

  it("returns the scored public-data base recommendation when Gemini generation fails", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ error: { message: "Gemini unavailable" } }, { status: 503 }),
    );

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          profile: {
            stressLevel: 8,
            sleepQuality: "poor",
            fitnessLevel: "beginner",
            preferredActivities: ["walking"],
            companions: "solo",
            maxTravelTime: 60,
            accessibilityNeeds: ["none"],
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      cached: true,
      data: {
        facility: {
          id: expect.stringMatching(/^healing-forest-/),
        },
      },
      error: expect.stringContaining("Gemini"),
    });
  });

  it("reflects request environment data in the recommendation assessment", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));

    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile-1",
          profile: {
            stressLevel: 7,
            sleepQuality: "normal",
            fitnessLevel: "beginner",
            preferredActivities: ["walking"],
            companions: "solo",
            maxTravelTime: 60,
            accessibilityNeeds: ["none"],
          },
          environment: {
            weather: {
              temperature: 31,
              minTemp: 24,
              maxTemp: 33,
              sky: "흐림",
              precipitationType: "비",
              precipitationProbability: 80,
              humidity: 88,
              windSpeed: 5,
            },
            airQuality: {
              dataTime: "2026-05-22 10:00",
              pm10Value: 90,
              pm25Value: 55,
              o3Value: 0.08,
              khaiValue: 151,
              khaiGrade: 4,
              pm10Grade: 3,
              pm25Grade: 4,
              stationName: "Test Station",
            },
            uvIndex: 9,
            uvLevel: "매우높음",
          },
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        GEMINI_MODEL: "gemini-3-flash-preview",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.environment.suitabilityScore).toBeLessThan(60);
    expect(payload.data.environment.weatherNote).toContain("강수확률 80%");
    expect(payload.data.environment.airQualityNote).toContain("Test Station");
    expect(payload.data.environment.uvNote).toContain("9");
  });

  it("rejects requests when the Gemini key is missing", async () => {
    const response = await handleRecommendationApiRequest(
      new Request("https://forest.test/api/recommendation", {
        method: "POST",
        body: JSON.stringify({ profileId: "profile-1" }),
      }),
      { GEMINI_API_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });
});
