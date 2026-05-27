import { latLngToGrid } from "./grid-converter";
import type { PrecipitationType, SkyCondition, WeatherData } from "@/types";

const KMA_VILAGE_FORECAST_URL =
  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const VILAGE_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
const RELEASE_DELAY_MINUTES = 10;

export type KmaForecastItem = {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string | number;
  nx: string | number;
  ny: string | number;
};

type KmaApiResponse = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaForecastItem | KmaForecastItem[];
      };
    };
  };
};

export type KmaForecastBase = {
  baseDate: string;
  baseTime: string;
};

export type FetchKmaWeatherOptions = {
  lat: number;
  lng: number;
  serviceKey: string;
  now?: Date;
  fetchImpl?: typeof fetch;
};

function toKstDate(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

function formatKstDate(kstDate: Date): string {
  const year = kstDate.getUTCFullYear();
  const month = `${kstDate.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${kstDate.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function shiftKstDays(kstDate: Date, days: number): Date {
  const shifted = new Date(kstDate);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function getLatestVilageForecastBase(now = new Date()): KmaForecastBase {
  const kstNow = toKstDate(now);
  const currentMinutes = kstNow.getUTCHours() * 60 + kstNow.getUTCMinutes();

  const baseHour = [...VILAGE_BASE_HOURS]
    .reverse()
    .find((hour) => currentMinutes >= hour * 60 + RELEASE_DELAY_MINUTES);

  if (baseHour == null) {
    return {
      baseDate: formatKstDate(shiftKstDays(kstNow, -1)),
      baseTime: "2300",
    };
  }

  return {
    baseDate: formatKstDate(kstNow),
    baseTime: `${baseHour}`.padStart(2, "0") + "00",
  };
}

export function buildKmaVilageForecastUrl(params: {
  serviceKey: string;
  baseDate: string;
  baseTime: string;
  nx: number;
  ny: number;
  numOfRows?: number;
  pageNo?: number;
}): string {
  const url = new URL(KMA_VILAGE_FORECAST_URL);
  url.searchParams.set("numOfRows", `${params.numOfRows ?? 1000}`);
  url.searchParams.set("pageNo", `${params.pageNo ?? 1}`);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", params.baseDate);
  url.searchParams.set("base_time", params.baseTime);
  url.searchParams.set("nx", `${params.nx}`);
  url.searchParams.set("ny", `${params.ny}`);
  const rawKey = params.serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

function asNumber(value: string | number | undefined, fallback: number): number {
  if (value == null || value === "") return fallback;
  const normalized = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(normalized)) return fallback;
  if (normalized >= 900 || normalized <= -900) return fallback;
  return normalized;
}

function skyFromCode(value: string | number | undefined): SkyCondition {
  switch (`${value}`) {
    case "1":
      return "맑음";
    case "3":
      return "구름많음";
    case "4":
      return "흐림";
    default:
      return "맑음";
  }
}

function precipitationFromCode(value: string | number | undefined): PrecipitationType {
  switch (`${value}`) {
    case "1":
      return "비";
    case "2":
      return "비/눈";
    case "3":
      return "눈";
    case "4":
      return "소나기";
    default:
      return "없음";
  }
}

function sortByForecastTime(items: KmaForecastItem[]): KmaForecastItem[] {
  return [...items].sort((a, b) =>
    `${a.fcstDate}${a.fcstTime}`.localeCompare(`${b.fcstDate}${b.fcstTime}`),
  );
}

export function normalizeKmaVilageForecastItems(items: KmaForecastItem[]): WeatherData {
  if (items.length === 0) {
    throw new Error("기상청 단기예보 응답에 예보 항목이 없습니다.");
  }

  const sortedItems = sortByForecastTime(items);
  const targetTemperature = sortedItems.find((entry) => entry.category === "TMP");
  const targetTime = targetTemperature
    ? `${targetTemperature.fcstDate}${targetTemperature.fcstTime}`
    : null;

  const currentItems = targetTime
    ? sortedItems.filter((entry) => `${entry.fcstDate}${entry.fcstTime}` === targetTime)
    : sortedItems;

  const findCurrent = (category: string) =>
    currentItems.find((entry) => entry.category === category)?.fcstValue;
  const findAny = (category: string) =>
    sortedItems.find((entry) => entry.category === category)?.fcstValue;

  const temperature = asNumber(findCurrent("TMP") ?? findAny("TMP"), 0);

  return {
    temperature,
    minTemp: asNumber(findAny("TMN"), temperature),
    maxTemp: asNumber(findAny("TMX"), temperature),
    sky: skyFromCode(findCurrent("SKY") ?? findAny("SKY")),
    precipitationType: precipitationFromCode(findCurrent("PTY") ?? findAny("PTY")),
    precipitationProbability: asNumber(findCurrent("POP") ?? findAny("POP"), 0),
    humidity: asNumber(findCurrent("REH") ?? findAny("REH"), 0),
    windSpeed: asNumber(findCurrent("WSD") ?? findAny("WSD"), 0),
  };
}

function normalizeItems(payload: KmaApiResponse): KmaForecastItem[] {
  const resultCode = `${payload.response?.header?.resultCode ?? ""}`;
  const resultMsg = payload.response?.header?.resultMsg ?? "기상청 API 오류";

  if (resultCode !== "00" && resultCode !== "0") {
    throw new Error(`기상청 단기예보 API 오류(${resultCode}): ${resultMsg}`);
  }

  const items = payload.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export async function fetchKmaWeather({
  lat,
  lng,
  serviceKey,
  now = new Date(),
  fetchImpl = fetch,
}: FetchKmaWeatherOptions): Promise<WeatherData> {
  if (!serviceKey.trim()) {
    throw new Error("KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.");
  }

  const { nx, ny } = latLngToGrid(lat, lng);
  const { baseDate, baseTime } = getLatestVilageForecastBase(now);
  const url = buildKmaVilageForecastUrl({ serviceKey, baseDate, baseTime, nx, ny });
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`기상청 단기예보 HTTP 오류: ${response.status}`);
  }

  const payload = (await response.json()) as KmaApiResponse;
  return normalizeKmaVilageForecastItems(normalizeItems(payload));
}
