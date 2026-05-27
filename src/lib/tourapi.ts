import type { NearbyPlace } from "@/types";

const TOUR_API_LOCATION_URL = "https://apis.data.go.kr/B551011/KorService2/locationBasedList2";
const TOUR_API_MOBILE_APP = "ForestTherapyAI";

export type TourApiLocationQuery = {
  serviceKey: string;
  lat: string | number;
  lng: string | number;
  radius?: string | number;
  pageNo?: string | number;
  numOfRows?: string | number;
  arrange?: "A" | "C" | "D" | "E" | "O" | "Q" | "R" | "S";
  contentTypeId?: string | number;
  lclsSystm1?: string;
  lclsSystm2?: string;
  lclsSystm3?: string;
};

export type FetchNearbyTourismPlacesOptions = TourApiLocationQuery & {
  fetchImpl?: typeof fetch;
  limit?: number;
};

type StandardTourApiBody = {
  items?: unknown[] | { item?: unknown | unknown[] };
  pageNo?: string | number;
  numOfRows?: string | number;
  totalCount?: string | number;
};

type StandardTourApiResponse = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: StandardTourApiBody;
  };
};

export type TourApiLocationList = {
  resultCode: string;
  resultMsg: string;
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  items: NearbyPlace[];
};

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value == null || value === "") return;
  params.set(key, `${value}`);
}

export function buildTourApiLocationUrl({
  serviceKey,
  lat,
  lng,
  radius = 20_000,
  pageNo = 1,
  numOfRows = 10,
  arrange = "E",
  contentTypeId,
  lclsSystm1,
  lclsSystm2,
  lclsSystm3,
}: TourApiLocationQuery): string {
  const url = new URL(TOUR_API_LOCATION_URL);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", TOUR_API_MOBILE_APP);
  url.searchParams.set("_type", "json");
  url.searchParams.set("arrange", arrange);
  appendOptionalParam(url.searchParams, "pageNo", pageNo);
  appendOptionalParam(url.searchParams, "numOfRows", numOfRows);
  appendOptionalParam(url.searchParams, "mapX", lng);
  appendOptionalParam(url.searchParams, "mapY", lat);
  appendOptionalParam(url.searchParams, "radius", radius);
  appendOptionalParam(url.searchParams, "contentTypeId", contentTypeId);
  appendOptionalParam(url.searchParams, "lclsSystm1", lclsSystm1);
  appendOptionalParam(url.searchParams, "lclsSystm2", lclsSystm2);
  appendOptionalParam(url.searchParams, "lclsSystm3", lclsSystm3);
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

function readNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const normalized = `${value}`.trim();
  return normalized || undefined;
}

function normalizeItems(items: StandardTourApiBody["items"]): unknown[] {
  if (Array.isArray(items)) return items;
  const item = items && !Array.isArray(items) && "item" in items ? items.item : undefined;
  if (Array.isArray(item)) return item;
  return item == null ? [] : [item];
}

function formatDistance(value: unknown): string {
  const meters = toNumber(value);
  if (meters == null) return "";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${Math.round((meters / 1000) * 10) / 10}km`;
}

function distanceMeters(place: NearbyPlace): number {
  if (!place.distance) return Number.POSITIVE_INFINITY;
  if (place.distance.endsWith("km")) {
    return Number.parseFloat(place.distance) * 1000;
  }
  if (place.distance.endsWith("m")) {
    return Number.parseFloat(place.distance);
  }
  return Number.POSITIVE_INFINITY;
}

function classifyPlace(record: Record<string, unknown>): NearbyPlace["type"] {
  const contentTypeId = `${record.contenttypeid ?? record.contentTypeId ?? ""}`;
  const category1 = `${record.lclsSystm1 ?? ""}`;
  const category2 = `${record.lclsSystm2 ?? ""}`;
  const category3 = `${record.lclsSystm3 ?? ""}`;

  if (contentTypeId === "39" && (category2 === "FD05" || category3.startsWith("FD05"))) {
    return "cafe";
  }
  if (contentTypeId === "39" || category1 === "FD") {
    return "restaurant";
  }
  return "attraction";
}

function normalizeItem(item: unknown): NearbyPlace {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const address = [readString(record, "addr1"), readString(record, "addr2")]
    .filter(Boolean)
    .join(" ");

  return {
    type: classifyPlace(record),
    contentId: readString(record, "contentid"),
    contentTypeId: readString(record, "contenttypeid"),
    name: readString(record, "title") ?? "",
    distance: formatDistance(record.dist),
    description: address || readString(record, "tel"),
    imageUrl: readString(record, "firstimage") ?? readString(record, "firstimage2"),
    address: address || undefined,
    tel: readString(record, "tel"),
    lat: toNumber(record.mapy),
    lng: toNumber(record.mapx),
  };
}

export function normalizeTourApiLocationResponse(payload: unknown): TourApiLocationList {
  const response = (payload as StandardTourApiResponse | undefined)?.response;
  const header = response?.header;
  const body = response?.body;
  const resultCode = `${header?.resultCode ?? ""}`;
  const resultMsg = header?.resultMsg ?? "";

  if (resultCode && resultCode !== "0000") {
    throw new Error(resultMsg || "TourAPI request failed.");
  }

  return {
    resultCode,
    resultMsg,
    pageNo: readNumber(body?.pageNo),
    numOfRows: readNumber(body?.numOfRows),
    totalCount: readNumber(body?.totalCount),
    items: normalizeItems(body?.items)
      .map(normalizeItem)
      .filter((place) => place.name),
  };
}

async function fetchTourApiLocationList(
  query: TourApiLocationQuery & { fetchImpl: typeof fetch },
): Promise<TourApiLocationList> {
  const response = await query.fetchImpl(buildTourApiLocationUrl(query));
  if (!response.ok) {
    throw new Error(`TourAPI HTTP error: ${response.status}`);
  }
  return normalizeTourApiLocationResponse(await response.json());
}

function uniquePlaces(places: NearbyPlace[]): NearbyPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.contentId ? `content:${place.contentId}` : `name:${place.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchNearbyTourismPlaces({
  fetchImpl = fetch,
  limit = 8,
  radius = 20_000,
  numOfRows = 10,
  ...query
}: FetchNearbyTourismPlacesOptions): Promise<NearbyPlace[]> {
  const commonQuery = {
    ...query,
    radius,
    numOfRows,
    fetchImpl,
  };
  const lists = await Promise.all([
    fetchTourApiLocationList({
      ...commonQuery,
      contentTypeId: 39,
      lclsSystm1: "FD",
    }),
    fetchTourApiLocationList({
      ...commonQuery,
      contentTypeId: 39,
      lclsSystm1: "FD",
      lclsSystm2: "FD05",
    }),
    fetchTourApiLocationList({
      ...commonQuery,
      contentTypeId: 12,
    }),
  ]);

  return uniquePlaces(lists.flatMap((list) => list.items))
    .sort((a, b) => distanceMeters(a) - distanceMeters(b))
    .slice(0, limit);
}
