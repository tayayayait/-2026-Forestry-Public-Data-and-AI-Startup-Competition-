import { describe, expect, it, vi } from "vitest";

import { handleWeatherApiRequest } from "./weather-api-route";

const kmaResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
    body: {
      items: {
        item: [
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "TMP",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "22",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "TMN",
            fcstDate: "20260521",
            fcstTime: "0600",
            fcstValue: "15",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "TMX",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "26",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "SKY",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "1",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "PTY",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "0",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "POP",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "10",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "REH",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "55",
            nx: 60,
            ny: 127,
          },
          {
            baseDate: "20260521",
            baseTime: "1400",
            category: "WSD",
            fcstDate: "20260521",
            fcstTime: "1500",
            fcstValue: "3.2",
            nx: 60,
            ny: 127,
          },
        ],
      },
    },
  },
};

describe("handleWeatherApiRequest", () => {
  it("returns normalized weather data from KMA when the server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(kmaResponse));
    const response = await handleWeatherApiRequest(
      new Request("https://forest.test/api/weather?lat=37.5665&lng=126.978"),
      { KMA_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        temperature: 22,
        sky: "맑음",
        precipitationProbability: 10,
      },
      cached: false,
    });
  });

  it("rejects requests when KMA_SERVICE_KEY is missing", async () => {
    const response = await handleWeatherApiRequest(
      new Request("https://forest.test/api/weather?lat=37.5665&lng=126.978"),
      { KMA_SERVICE_KEY: "", VITE_KMA_SERVICE_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.",
    });
  });
});
