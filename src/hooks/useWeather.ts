import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  uvIndex: number;
  pm10: number;
  locationName: string;
}

export const DEFAULT_WEATHER_COORDS = { lat: 37.5665, lon: 126.978 };

const DEFAULT_WEATHER_PLACEHOLDER: WeatherData = {
  temperature: 20,
  weatherCode: 0,
  uvIndex: 2,
  pm10: 15,
  locationName: "현재 위치",
};

export function getHydrationSafeInitialCoords(): { lat: number; lon: number } {
  return DEFAULT_WEATHER_COORDS;
}

export function getHydrationSafeWeatherPlaceholder(): WeatherData {
  return { ...DEFAULT_WEATHER_PLACEHOLDER };
}

function readStoredCoords(): { lat: number; lon: number } | null {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem("last_coords");
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as Partial<{ lat: number; lon: number }>;
    return typeof parsed.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed.lon === "number" &&
      Number.isFinite(parsed.lon)
      ? { lat: parsed.lat, lon: parsed.lon }
      : null;
  } catch {
    return null;
  }
}

function saveWeatherSnapshot(weather: WeatherData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("last_weather", JSON.stringify(weather));
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1 || code === 2 || code === 3) return "구름 조금";
  if (code === 45 || code === 48) return "안개";
  if (code >= 51 && code <= 67) return "비";
  if (code >= 71 && code <= 77) return "눈";
  if (code >= 80 && code <= 82) return "소나기";
  if (code >= 95) return "뇌우";
  return "맑음";
}

export function getPm10Status(pm10: number): { text: string; color: string; textClass: string } {
  if (pm10 <= 30) return { text: "좋음", color: "text-emerald-500", textClass: "text-emerald-600" };
  if (pm10 <= 80) return { text: "보통", color: "text-blue-500", textClass: "text-blue-600" };
  if (pm10 <= 150) return { text: "나쁨", color: "text-amber-500", textClass: "text-amber-600" };
  return { text: "매우 나쁨", color: "text-rose-500", textClass: "text-rose-600" };
}

export function getUvStatus(uv: number): { text: string; color: string; textClass: string } {
  if (uv <= 2) return { text: "낮음", color: "text-emerald-500", textClass: "text-emerald-600" };
  if (uv <= 5) return { text: "보통", color: "text-amber-500", textClass: "text-amber-600" };
  if (uv <= 7) return { text: "높음", color: "text-orange-500", textClass: "text-orange-600" };
  return { text: "매우 높음", color: "text-rose-500", textClass: "text-rose-600" };
}

export function useWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(() =>
    getHydrationSafeInitialCoords(),
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const storedCoords = readStoredCoords();
    if (storedCoords) {
      setCoords(storedCoords);
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCoords(newCoords);
        window.localStorage.setItem("last_coords", JSON.stringify(newCoords));
      },
      (error) => {
        console.warn("위치 정보 권한 거부:", error);
        setLocationError("위치 접근 권한이 거부되었습니다.");
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const query = useQuery<WeatherData, Error>({
    queryKey: ["weather", coords?.lat, coords?.lon],
    queryFn: async () => {
      if (!coords) throw new Error("좌표 없음");

      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,uv_index&timezone=auto`,
      ).then((response) => response.json());

      const airQualityPromise = fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=pm10&timezone=auto`,
      ).then((response) => response.json());

      const locationNamePromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=10&addressdetails=1`,
      )
        .then((response) => response.json())
        .then((geoData) => {
          const address = geoData?.address;
          if (!address) return "현재 위치";

          const city = address.city || address.province || address.region || "";
          const district = address.borough || address.county || address.town || "";
          return city || district ? `${city} ${district}`.trim() : "현재 위치";
        })
        .catch((error) => {
          console.error("역지오코딩 실패:", error);
          return "현재 위치";
        });

      const [weatherData, aqData, locationName] = await Promise.all([
        weatherPromise,
        airQualityPromise,
        locationNamePromise,
      ]);

      const result = {
        temperature: Math.round(weatherData.current?.temperature_2m ?? 0),
        weatherCode: weatherData.current?.weather_code ?? 0,
        uvIndex: weatherData.current?.uv_index ?? 0,
        pm10: aqData.current?.pm10 ?? 0,
        locationName,
      };

      saveWeatherSnapshot(result);
      return result;
    },
    enabled: !!coords,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    locationError,
  };
}
