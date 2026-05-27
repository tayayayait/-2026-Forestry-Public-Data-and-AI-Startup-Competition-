import { describe, expect, it, vi } from "vitest";

import {
  buildKmaVilageForecastUrl,
  fetchKmaWeather,
  getLatestVilageForecastBase,
  normalizeKmaVilageForecastItems,
} from "./kma-short-term-forecast";

const item = (category: string, fcstValue: string, fcstTime = "1500") => ({
  baseDate: "20260521",
  baseTime: "1400",
  category,
  fcstDate: "20260521",
  fcstTime,
  fcstValue,
  nx: 60,
  ny: 127,
});

describe("getLatestVilageForecastBase", () => {
  it("uses the previous KMA base time before the 10 minute release point", () => {
    const base = getLatestVilageForecastBase(new Date("2026-05-21T05:09:00+09:00"));

    expect(base).toEqual({ baseDate: "20260521", baseTime: "0200" });
  });

  it("rolls back to yesterday when current KST time is before 02:10", () => {
    const base = getLatestVilageForecastBase(new Date("2026-05-21T01:59:00+09:00"));

    expect(base).toEqual({ baseDate: "20260520", baseTime: "2300" });
  });
});

describe("normalizeKmaVilageForecastItems", () => {
  it("maps KMA forecast categories into app weather data", () => {
    const weather = normalizeKmaVilageForecastItems([
      item("TMP", "22"),
      item("TMN", "15", "0600"),
      item("TMX", "26", "1500"),
      item("SKY", "3"),
      item("PTY", "0"),
      item("POP", "20"),
      item("REH", "55"),
      item("WSD", "3.2"),
    ]);

    expect(weather).toEqual({
      temperature: 22,
      minTemp: 15,
      maxTemp: 26,
      sky: "구름많음",
      precipitationType: "없음",
      precipitationProbability: 20,
      humidity: 55,
      windSpeed: 3.2,
    });
  });
});

describe("buildKmaVilageForecastUrl", () => {
  it("builds a JSON getVilageFcst request with grid coordinates", () => {
    const urlString = buildKmaVilageForecastUrl({
      serviceKey: "decoded-key",
      baseDate: "20260521",
      baseTime: "1400",
      nx: 60,
      ny: 127,
    });

    const url = new URL(urlString);

    expect(url.toString()).toContain(
      "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
    );
    expect(url.searchParams.get("dataType")).toBe("JSON");
    expect(url.searchParams.get("base_date")).toBe("20260521");
    expect(url.searchParams.get("base_time")).toBe("1400");
    expect(url.searchParams.get("nx")).toBe("60");
    expect(url.searchParams.get("ny")).toBe("127");
  });
});

describe("fetchKmaWeather", () => {
  it("throws a useful error when KMA returns a non-normal result code", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        response: {
          header: { resultCode: "30", resultMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" },
          body: {},
        },
      }),
    );

    await expect(
      fetchKmaWeather({
        lat: 37.5665,
        lng: 126.978,
        serviceKey: "bad-key",
        fetchImpl,
        now: new Date("2026-05-21T14:20:00+09:00"),
      }),
    ).rejects.toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });
});
