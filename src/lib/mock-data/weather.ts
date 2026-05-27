import type { WeatherData } from "@/types";

export function getMockWeather(): WeatherData {
  return {
    temperature: 22,
    minTemp: 15,
    maxTemp: 26,
    sky: "맑음",
    precipitationType: "없음",
    precipitationProbability: 10,
    humidity: 55,
    windSpeed: 3.2,
  };
}

export function getMockWeatherVariants() {
  return {
    good: getMockWeather(),
    normal: {
      ...getMockWeather(),
      sky: "구름많음",
      temperature: 24,
      humidity: 65,
    } as WeatherData,
    bad: {
      ...getMockWeather(),
      sky: "흐림",
      precipitationType: "비",
      precipitationProbability: 80,
      temperature: 18,
      humidity: 85,
    } as WeatherData,
  };
}
