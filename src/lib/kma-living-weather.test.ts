import { describe, expect, it, vi } from "vitest";

import {
  buildKmaUvIndexUrl,
  fetchKmaUvIndex,
  findNearestLivingWeatherArea,
  getLatestLivingWeatherIndexTime,
  normalizeKmaUvIndexItem,
  uvLevelFromIndex,
} from "./kma-living-weather";

describe("getLatestLivingWeatherIndexTime", () => {
  it("uses yesterday 18시 before today's 06시 발표", () => {
    expect(getLatestLivingWeatherIndexTime(new Date("2026-05-21T05:59:00+09:00"))).toBe(
      "2026052018",
    );
  });

  it("uses today's 06시 between 06시 and 18시", () => {
    expect(getLatestLivingWeatherIndexTime(new Date("2026-05-21T13:00:00+09:00"))).toBe(
      "2026052106",
    );
  });

  it("uses today's 18시 after 18시", () => {
    expect(getLatestLivingWeatherIndexTime(new Date("2026-05-21T18:30:00+09:00"))).toBe(
      "2026052118",
    );
  });
});

describe("findNearestLivingWeatherArea", () => {
  it("selects the Seoul area code for Seoul coordinates", () => {
    expect(findNearestLivingWeatherArea(37.5665, 126.978)).toMatchObject({
      areaNo: "1100000000",
      name: "서울특별시",
    });
  });

  it("selects the Jeju area code for Jeju coordinates", () => {
    expect(findNearestLivingWeatherArea(33.4996, 126.5312)).toMatchObject({
      areaNo: "5000000000",
      name: "제주특별자치도",
    });
  });
});

describe("uvLevelFromIndex", () => {
  it("maps KMA UV ranges into app UV labels", () => {
    expect(uvLevelFromIndex(2)).toBe("낮음");
    expect(uvLevelFromIndex(5)).toBe("보통");
    expect(uvLevelFromIndex(7)).toBe("높음");
    expect(uvLevelFromIndex(10)).toBe("매우높음");
    expect(uvLevelFromIndex(11)).toBe("위험");
  });
});

describe("normalizeKmaUvIndexItem", () => {
  it("uses the current V5 h0 forecast when it exists", () => {
    expect(
      normalizeKmaUvIndexItem(
        {
          code: "A07_1",
          areaNo: "1100000000",
          date: "2026052106",
          h0: "5",
          h3: "8",
        },
        "서울특별시",
      ),
    ).toMatchObject({
      uvIndex: 5,
      uvLevel: "보통",
      forecastHour: 0,
    });
  });

  it("falls back to the next V5 forecast horizon when h0 is unavailable", () => {
    expect(
      normalizeKmaUvIndexItem(
        {
          code: "A07_1",
          areaNo: "1100000000",
          date: "2026052118",
          h0: "",
          h3: "8",
          h6: "4",
        },
        "서울특별시",
      ),
    ).toMatchObject({
      uvIndex: 8,
      uvLevel: "매우높음",
      forecastHour: 3,
    });
  });
});

describe("buildKmaUvIndexUrl", () => {
  it("builds a JSON getUVIdxV5 request", () => {
    const urlString = buildKmaUvIndexUrl({
      serviceKey: "decoded-key",
      areaNo: "1100000000",
      time: "2026052106",
    });

    const url = new URL(urlString);

    expect(url.toString()).toContain(
      "http://apis.data.go.kr/1360000/LivingWthrIdxServiceV5/getUVIdxV5",
    );
    expect(url.searchParams.get("ServiceKey")).toBe("decoded-key");
    expect(url.searchParams.get("serviceKey")).toBeNull();
    expect(url.searchParams.get("dataType")).toBe("JSON");
    expect(url.searchParams.get("areaNo")).toBe("1100000000");
    expect(url.searchParams.get("time")).toBe("2026052106");
  });
});

describe("fetchKmaUvIndex", () => {
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
      fetchKmaUvIndex({
        lat: 37.5665,
        lng: 126.978,
        serviceKey: "bad-key",
        fetchImpl,
        now: new Date("2026-05-21T14:20:00+09:00"),
      }),
    ).rejects.toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });
});
