import type { AirQualityData } from "@/types";

export function getMockAirQuality(): AirQualityData {
  const now = new Date();

  return {
    dataTime: now.toISOString(),
    pm10Value: 35,
    pm25Value: 18,
    o3Value: 0.03,
    khaiValue: 52,
    khaiGrade: 1, // 1: 좋음
    pm10Grade: 1,
    pm25Grade: 1,
    stationName: "종로구",
  };
}
