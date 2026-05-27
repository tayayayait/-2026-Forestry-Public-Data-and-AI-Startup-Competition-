import { describe, expect, it, vi } from "vitest";

import { handleAirQualityApiRequest } from "./air-quality-api-route";

const stationListResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
    body: {
      items: [
        {
          stationCode: "111123",
          stationName: "종로구",
          addr: "서울 종로구 종로35가길 19",
          mangName: "도시대기",
          dmX: "127.005028",
          dmY: "37.572025",
        },
      ],
    },
  },
};

const measurementResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
    body: {
      items: [
        {
          dataTime: "2026-05-21 15:00",
          stationName: "종로구",
          stationCode: "111123",
          pm10Value: "35",
          pm25Value: "18",
          o3Value: "0.043",
          khaiValue: "52",
          khaiGrade: "2",
          pm10Grade: "2",
          pm25Grade: "1",
        },
      ],
    },
  },
};

describe("handleAirQualityApiRequest", () => {
  it("returns normalized AirKorea air quality data when the server key exists", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(Response.json(stationListResponse))
      .mockResolvedValueOnce(Response.json(measurementResponse));

    const response = await handleAirQualityApiRequest(
      new Request("https://forest.test/api/air-quality?lat=37.5665&lng=126.978"),
      { AIRKOREA_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        stationName: "종로구",
        pm10Value: 35,
        pm25Value: 18,
      },
      cached: false,
    });
  });

  it("rejects requests when no public-data service key is available", async () => {
    const response = await handleAirQualityApiRequest(
      new Request("https://forest.test/api/air-quality?lat=37.5665&lng=126.978"),
      { AIRKOREA_SERVICE_KEY: "", KMA_SERVICE_KEY: "", VITE_KMA_SERVICE_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });
});
