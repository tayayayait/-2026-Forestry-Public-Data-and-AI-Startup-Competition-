import type { UVIndexData, UVLevel } from "@/types";

const KMA_UV_INDEX_URL = "http://apis.data.go.kr/1360000/LivingWthrIdxServiceV5/getUVIdxV5";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type LivingWeatherArea = {
  areaNo: string;
  name: string;
  lat: number;
  lng: number;
};

type KmaUvForecastField = `h${number}`;

type KmaUvIndexItem = {
  code?: string;
  areaNo?: string;
  date?: string;
} & Partial<Record<KmaUvForecastField, string | number | null>>;

type KmaUvIndexResponse = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaUvIndexItem | KmaUvIndexItem[];
      };
    };
  };
};

const UV_FORECAST_HOURS = [
  0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72,
  75,
] as const;

export type FetchKmaUvIndexOptions = {
  lat: number;
  lng: number;
  serviceKey: string;
  now?: Date;
  fetchImpl?: typeof fetch;
};

const LIVING_WEATHER_AREAS: LivingWeatherArea[] = [
  { areaNo: "1100000000", name: "서울특별시", lat: 37.56356944444444, lng: 126.98000833333333 },
  { areaNo: "2600000000", name: "부산광역시", lat: 35.17701944444444, lng: 129.07695277777776 },
  { areaNo: "2700000000", name: "대구광역시", lat: 35.868541666666665, lng: 128.60355277777776 },
  { areaNo: "2800000000", name: "인천광역시", lat: 37.45323333333334, lng: 126.70735277777779 },
  { areaNo: "2900000000", name: "광주광역시", lat: 35.156974999999996, lng: 126.85336388888888 },
  { areaNo: "3000000000", name: "대전광역시", lat: 36.347119444444445, lng: 127.38656666666667 },
  { areaNo: "3100000000", name: "울산광역시", lat: 35.53540833333333, lng: 129.3136888888889 },
  { areaNo: "3600000000", name: "세종특별자치시", lat: 36.48001111111111, lng: 127.28906944444444 },
  { areaNo: "4100000000", name: "경기도", lat: 37.27184444444444, lng: 127.01168888888888 },
  { areaNo: "4300000000", name: "충청북도", lat: 36.6325, lng: 127.49358611111111 },
  { areaNo: "4400000000", name: "충청남도", lat: 36.658813888888886, lng: 126.67279722222223 },
  { areaNo: "4600000000", name: "전라남도", lat: 34.813044444444444, lng: 126.465 },
  { areaNo: "4700000000", name: "경상북도", lat: 36.57599851182954, lng: 128.50583225609827 },
  { areaNo: "4800000000", name: "경상남도", lat: 35.23473611111111, lng: 128.69416666666666 },
  { areaNo: "5000000000", name: "제주특별자치도", lat: 33.48569444444445, lng: 126.50033333333333 },
  { areaNo: "5100000000", name: "강원특별자치도", lat: 37.882691666666666, lng: 127.731975 },
  { areaNo: "5200000000", name: "전북특별자치도", lat: 35.817275, lng: 127.11105277777777 },
];

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

export function getLatestLivingWeatherIndexTime(now = new Date()): string {
  const kstNow = toKstDate(now);
  const hour = kstNow.getUTCHours();

  if (hour >= 18) {
    return `${formatKstDate(kstNow)}18`;
  }

  if (hour >= 6) {
    return `${formatKstDate(kstNow)}06`;
  }

  return `${formatKstDate(shiftKstDays(kstNow, -1))}18`;
}

function squaredDistance(lat: number, lng: number, area: LivingWeatherArea): number {
  return (lat - area.lat) ** 2 + (lng - area.lng) ** 2;
}

export function findNearestLivingWeatherArea(lat: number, lng: number): LivingWeatherArea {
  return LIVING_WEATHER_AREAS.reduce((nearest, area) =>
    squaredDistance(lat, lng, area) < squaredDistance(lat, lng, nearest) ? area : nearest,
  );
}

export function uvLevelFromIndex(index: number): UVLevel {
  if (index >= 11) return "위험";
  if (index >= 8) return "매우높음";
  if (index >= 6) return "높음";
  if (index >= 3) return "보통";
  return "낮음";
}

function parseIndex(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeKmaUvIndexItem(item: KmaUvIndexItem, areaName: string): UVIndexData {
  const forecasts = UV_FORECAST_HOURS.map(
    (forecastHour) => [forecastHour, parseIndex(item[`h${forecastHour}`])] as const,
  );
  const selected = forecasts.find(([, value]) => value != null);

  if (!selected) {
    throw new Error("기상청 자외선지수 응답에 예측값이 없습니다.");
  }

  const [forecastHour] = selected;
  const uvIndex = selected[1] as number;

  return {
    areaNo: item.areaNo ?? "",
    areaName,
    date: item.date ?? "",
    uvIndex,
    uvLevel: uvLevelFromIndex(uvIndex),
    forecastHour,
  };
}

export function buildKmaUvIndexUrl(params: {
  serviceKey: string;
  areaNo: string;
  time: string;
  numOfRows?: number;
  pageNo?: number;
}): string {
  const url = new URL(KMA_UV_INDEX_URL);
  url.searchParams.set("numOfRows", `${params.numOfRows ?? 10}`);
  url.searchParams.set("pageNo", `${params.pageNo ?? 1}`);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("areaNo", params.areaNo);
  url.searchParams.set("time", params.time);
  const rawKey = params.serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&ServiceKey=${rawKey}`;
}

function normalizeItem(payload: KmaUvIndexResponse): KmaUvIndexItem {
  const resultCode = `${payload.response?.header?.resultCode ?? ""}`;
  const resultMsg = payload.response?.header?.resultMsg ?? "기상청 생활기상지수 API 오류";

  if (resultCode !== "00" && resultCode !== "0") {
    throw new Error(`기상청 자외선지수 API 오류(${resultCode}): ${resultMsg}`);
  }

  const item = payload.response?.body?.items?.item;
  if (!item) {
    throw new Error("기상청 자외선지수 응답에 항목이 없습니다.");
  }

  return Array.isArray(item) ? item[0] : item;
}

export async function fetchKmaUvIndex({
  lat,
  lng,
  serviceKey,
  now = new Date(),
  fetchImpl = fetch,
}: FetchKmaUvIndexOptions): Promise<UVIndexData> {
  if (!serviceKey.trim()) {
    throw new Error("KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.");
  }

  const area = findNearestLivingWeatherArea(lat, lng);
  const time = getLatestLivingWeatherIndexTime(now);
  const url = buildKmaUvIndexUrl({ serviceKey, areaNo: area.areaNo, time });
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`기상청 자외선지수 HTTP 오류: ${response.status}`);
  }

  const payload = (await response.json()) as KmaUvIndexResponse;
  return normalizeKmaUvIndexItem(normalizeItem(payload), area.name);
}
