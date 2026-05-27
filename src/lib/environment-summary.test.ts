import { describe, expect, it } from "vitest";

import { buildHomeEnvironmentSummary } from "./environment-summary";
import type { AirQualityData, WeatherData } from "@/types";

const weather: WeatherData = {
  temperature: 23,
  minTemp: 18,
  maxTemp: 27,
  sky: "맑음",
  precipitationType: "없음",
  precipitationProbability: 10,
  humidity: 55,
  windSpeed: 2.4,
};

const airQuality: AirQualityData = {
  dataTime: "2026-05-22 10:00",
  pm10Value: 35,
  pm25Value: 18,
  o3Value: 0.03,
  khaiValue: 52,
  khaiGrade: 2,
  pm10Grade: 2,
  pm25Grade: 1,
  stationName: "종로구",
};

describe("buildHomeEnvironmentSummary", () => {
  it("prompts for location before coordinates are available", () => {
    const summary = buildHomeEnvironmentSummary({
      hasLocation: false,
      locationStatus: "idle",
      weather: null,
      airQuality: null,
      uvIndex: null,
      uvLevel: null,
    });

    expect(summary).toMatchObject({
      title: "오늘의 치유 날씨",
      line: "현재 위치를 설정하면 날씨, 대기질, 자외선 정보를 반영합니다.",
      ctaLabel: "현재 위치 사용",
    });
  });

  it("formats loaded weather, air quality, and UV data", () => {
    const summary = buildHomeEnvironmentSummary({
      hasLocation: true,
      locationStatus: "success",
      weather,
      airQuality,
      uvIndex: 6,
      uvLevel: "높음",
    });

    expect(summary.line).toBe("23°C · 대기질 보통 · UV 높음");
    expect(summary.badges).toEqual([
      { label: "강수 10%", variant: "env-good" },
      { label: "대기질 보통", variant: "env-moderate" },
      { label: "UV 높음", variant: "env-bad" },
    ]);
    expect(summary.ctaLabel).toBe("환경 정보 새로고침");
  });

  it("surfaces poor outdoor conditions as a caution", () => {
    const summary = buildHomeEnvironmentSummary({
      hasLocation: true,
      locationStatus: "success",
      weather: { ...weather, precipitationProbability: 75 },
      airQuality: { ...airQuality, khaiGrade: 4 },
      uvIndex: 9,
      uvLevel: "매우높음",
    });

    expect(summary.statusLabel).toBe("주의");
    expect(summary.badges.every((badge) => badge.variant === "env-bad")).toBe(true);
  });
});
