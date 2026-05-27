import type { AirQualityData, AirQualityGrade } from "@/types";

const AIRKOREA_STATION_LIST_URL =
  "http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getMsrstnList";
const AIRKOREA_MEASUREMENT_URL =
  "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty";

type AirKoreaSido = {
  sidoName: string;
  lat: number;
  lng: number;
};

export type AirKoreaStation = {
  stationName: string;
  stationCode: string | null;
  address: string;
  mangName: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
};

type AirKoreaStationItem = {
  stationCode?: string | null;
  stationName?: string | null;
  addr?: string | null;
  mangName?: string | null;
  dmX?: string | number | null;
  dmY?: string | number | null;
};

type AirKoreaMeasurementItem = {
  dataTime?: string | null;
  stationName?: string | null;
  stationCode?: string | null;
  mangName?: string | null;
  pm10Value?: string | number | null;
  pm25Value?: string | number | null;
  o3Value?: string | number | null;
  khaiValue?: string | number | null;
  khaiGrade?: string | number | null;
  pm10Grade?: string | number | null;
  pm25Grade?: string | number | null;
};

type AirKoreaResponse<T> = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: {
      items?: T[] | { item?: T | T[] };
    };
  };
};

export type FetchAirKoreaAirQualityOptions = {
  lat: number;
  lng: number;
  serviceKey: string;
  fetchImpl?: typeof fetch;
};

const AIRKOREA_SIDO_LIST: AirKoreaSido[] = [
  { sidoName: "서울", lat: 37.56356944444444, lng: 126.98000833333333 },
  { sidoName: "부산", lat: 35.17701944444444, lng: 129.07695277777776 },
  { sidoName: "대구", lat: 35.868541666666665, lng: 128.60355277777776 },
  { sidoName: "인천", lat: 37.45323333333334, lng: 126.70735277777779 },
  { sidoName: "광주", lat: 35.156974999999996, lng: 126.85336388888888 },
  { sidoName: "대전", lat: 36.347119444444445, lng: 127.38656666666667 },
  { sidoName: "울산", lat: 35.53540833333333, lng: 129.3136888888889 },
  { sidoName: "세종", lat: 36.48001111111111, lng: 127.28906944444444 },
  { sidoName: "경기", lat: 37.27184444444444, lng: 127.01168888888888 },
  { sidoName: "강원", lat: 37.882691666666666, lng: 127.731975 },
  { sidoName: "충북", lat: 36.6325, lng: 127.49358611111111 },
  { sidoName: "충남", lat: 36.658813888888886, lng: 126.67279722222223 },
  { sidoName: "전북", lat: 35.817275, lng: 127.11105277777777 },
  { sidoName: "전남", lat: 34.813044444444444, lng: 126.465 },
  { sidoName: "경북", lat: 36.57599851182954, lng: 128.50583225609827 },
  { sidoName: "경남", lat: 35.23473611111111, lng: 128.69416666666666 },
  { sidoName: "제주", lat: 33.48569444444445, lng: 126.50033333333333 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusKm = 6371;
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundDistance(distanceKm: number): number {
  return Math.round(distanceKm * 100) / 100;
}

function parseNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "" || value === "-") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGrade(value: string | number | null | undefined): AirQualityGrade | null {
  const parsed = parseNumber(value);
  return parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4 ? parsed : null;
}

function isLikelyKoreaLat(value: number): boolean {
  return value >= 32 && value <= 39;
}

function isLikelyKoreaLng(value: number): boolean {
  return value >= 124 && value <= 132;
}

function parseStationCoordinate(
  dmX: string | number | null | undefined,
  dmY: string | number | null | undefined,
): { lat: number; lng: number } | null {
  const x = parseNumber(dmX);
  const y = parseNumber(dmY);
  if (x == null || y == null) return null;

  if (isLikelyKoreaLat(x) && isLikelyKoreaLng(y)) {
    return { lat: x, lng: y };
  }

  if (isLikelyKoreaLng(x) && isLikelyKoreaLat(y)) {
    return { lat: y, lng: x };
  }

  return { lat: y, lng: x };
}

function getItems<T>(response: AirKoreaResponse<T>): T[] {
  const items = response.response?.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (!items.item) return [];
  return Array.isArray(items.item) ? items.item : [items.item];
}

function assertNormalResponse<T>(response: AirKoreaResponse<T>, label: string): void {
  const code = `${response.response?.header?.resultCode ?? ""}`;
  if (code && code !== "00") {
    throw new Error(response.response?.header?.resultMsg ?? `${label} 조회에 실패했습니다.`);
  }
}

export function findNearestAirKoreaSido(lat: number, lng: number): AirKoreaSido {
  return AIRKOREA_SIDO_LIST.reduce((nearest, current) => {
    const currentDistance = haversineKm(lat, lng, current.lat, current.lng);
    const nearestDistance = haversineKm(lat, lng, nearest.lat, nearest.lng);
    return currentDistance < nearestDistance ? current : nearest;
  });
}

export function buildAirKoreaStationListUrl({
  serviceKey,
  addr,
}: {
  serviceKey: string;
  addr: string;
}): string {
  const url = new URL(AIRKOREA_STATION_LIST_URL);
  url.searchParams.set("returnType", "json");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("addr", addr);
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

export function buildAirKoreaAirQualityUrl({
  serviceKey,
  stationName,
}: {
  serviceKey: string;
  stationName: string;
}): string {
  const url = new URL(AIRKOREA_MEASUREMENT_URL);
  url.searchParams.set("returnType", "json");
  url.searchParams.set("numOfRows", "1");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("stationName", stationName);
  url.searchParams.set("dataTerm", "DAILY");
  url.searchParams.set("ver", "1.3");
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

export function selectNearestAirKoreaStation(
  stationItems: AirKoreaStationItem[],
  lat: number,
  lng: number,
): AirKoreaStation {
  const stations = stationItems
    .map((item) => {
      const coords = parseStationCoordinate(item.dmX, item.dmY);
      if (!item.stationName || coords == null) return null;

      return {
        stationName: item.stationName,
        stationCode: item.stationCode ?? null,
        address: item.addr ?? "",
        mangName: item.mangName ?? null,
        lat: coords.lat,
        lng: coords.lng,
        distanceKm: roundDistance(haversineKm(lat, lng, coords.lat, coords.lng)),
      };
    })
    .filter((station): station is AirKoreaStation => station != null);

  if (stations.length === 0) {
    throw new Error("좌표가 포함된 에어코리아 측정소를 찾지 못했습니다.");
  }

  return stations.reduce((nearest, current) =>
    current.distanceKm < nearest.distanceKm ? current : nearest,
  );
}

export function normalizeAirKoreaMeasurementItem(
  item: AirKoreaMeasurementItem,
  station: AirKoreaStation,
): AirQualityData {
  return {
    dataTime: item.dataTime ?? "",
    stationName: item.stationName ?? station.stationName,
    stationCode: item.stationCode ?? station.stationCode ?? undefined,
    stationAddress: station.address,
    stationLat: station.lat,
    stationLng: station.lng,
    stationDistanceKm: station.distanceKm,
    mangName: item.mangName ?? station.mangName ?? undefined,
    pm10Value: parseNumber(item.pm10Value),
    pm25Value: parseNumber(item.pm25Value),
    o3Value: parseNumber(item.o3Value),
    khaiValue: parseNumber(item.khaiValue),
    khaiGrade: parseGrade(item.khaiGrade),
    pm10Grade: parseGrade(item.pm10Grade),
    pm25Grade: parseGrade(item.pm25Grade),
  };
}

export async function fetchAirKoreaAirQuality({
  lat,
  lng,
  serviceKey,
  fetchImpl = fetch,
}: FetchAirKoreaAirQualityOptions): Promise<AirQualityData> {
  const sido = findNearestAirKoreaSido(lat, lng);
  const stationResponse = await fetchImpl(
    buildAirKoreaStationListUrl({ serviceKey, addr: sido.sidoName }),
  );
  if (!stationResponse.ok) {
    throw new Error(`에어코리아 측정소정보 HTTP 오류: ${stationResponse.status}`);
  }

  const stationPayload = (await stationResponse.json()) as AirKoreaResponse<AirKoreaStationItem>;
  assertNormalResponse(stationPayload, "에어코리아 측정소정보");
  const station = selectNearestAirKoreaStation(getItems(stationPayload), lat, lng);

  const measurementResponse = await fetchImpl(
    buildAirKoreaAirQualityUrl({ serviceKey, stationName: station.stationName }),
  );
  if (!measurementResponse.ok) {
    throw new Error(`에어코리아 대기오염정보 HTTP 오류: ${measurementResponse.status}`);
  }

  const measurementPayload =
    (await measurementResponse.json()) as AirKoreaResponse<AirKoreaMeasurementItem>;
  assertNormalResponse(measurementPayload, "에어코리아 대기오염정보");
  const [measurement] = getItems(measurementPayload);
  if (!measurement) {
    throw new Error("에어코리아 대기오염정보 응답에 측정값이 없습니다.");
  }

  return normalizeAirKoreaMeasurementItem(measurement, station);
}
