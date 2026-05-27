import type { RecreationForest, RecreationForestList } from "@/types";

const RECREATION_FORESTS_URL = "https://api.data.go.kr/openapi/tn_pubr_public_rcrfrst_api";

export type RecreationForestsQuery = {
  serviceKey: string;
  pageNo?: string | number;
  numOfRows?: string | number;
  rcrfrstNm?: string;
  ctprvnNm?: string;
  rcrfrstType?: string;
  rcrfrstAr?: string | number;
  aceptncCo?: string | number;
  admfee?: string;
  stayngPosblYn?: string;
  mainFcltyNm?: string;
  rdnmadr?: string;
  institutionNm?: string;
  telephoneNumber?: string;
  homepageUrl?: string;
  latitude?: string | number;
  longitude?: string | number;
  referenceDate?: string;
  instt_code?: string;
};

export type FetchRecreationForestsOptions = RecreationForestsQuery & {
  fetchImpl?: typeof fetch;
};

type StandardApiBody = {
  items?: unknown[] | { item?: unknown | unknown[] };
  pageNo?: string | number;
  numOfRows?: string | number;
  totalCount?: string | number;
};

type StandardApiResponse = {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: StandardApiBody;
  };
};

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value == null || value === "") return;
  params.set(key, `${value}`);
}

export function buildRecreationForestsUrl({
  serviceKey,
  pageNo = 1,
  numOfRows = 100,
  rcrfrstNm,
  ctprvnNm,
  rcrfrstType,
  rcrfrstAr,
  aceptncCo,
  admfee,
  stayngPosblYn,
  mainFcltyNm,
  rdnmadr,
  institutionNm,
  telephoneNumber,
  homepageUrl,
  latitude,
  longitude,
  referenceDate,
  instt_code,
}: RecreationForestsQuery): string {
  const url = new URL(RECREATION_FORESTS_URL);
  url.searchParams.set("type", "json");
  appendOptionalParam(url.searchParams, "pageNo", pageNo);
  appendOptionalParam(url.searchParams, "numOfRows", numOfRows);
  appendOptionalParam(url.searchParams, "rcrfrstNm", rcrfrstNm);
  appendOptionalParam(url.searchParams, "ctprvnNm", ctprvnNm);
  appendOptionalParam(url.searchParams, "rcrfrstType", rcrfrstType);
  appendOptionalParam(url.searchParams, "rcrfrstAr", rcrfrstAr);
  appendOptionalParam(url.searchParams, "aceptncCo", aceptncCo);
  appendOptionalParam(url.searchParams, "admfee", admfee);
  appendOptionalParam(url.searchParams, "stayngPosblYn", stayngPosblYn);
  appendOptionalParam(url.searchParams, "mainFcltyNm", mainFcltyNm);
  appendOptionalParam(url.searchParams, "rdnmadr", rdnmadr);
  appendOptionalParam(url.searchParams, "institutionNm", institutionNm);
  appendOptionalParam(url.searchParams, "telephoneNumber", telephoneNumber);
  appendOptionalParam(url.searchParams, "homepageUrl", homepageUrl);
  appendOptionalParam(url.searchParams, "latitude", latitude);
  appendOptionalParam(url.searchParams, "longitude", longitude);
  appendOptionalParam(url.searchParams, "referenceDate", referenceDate);
  appendOptionalParam(url.searchParams, "instt_code", instt_code);
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown): boolean | null {
  const normalized = `${value ?? ""}`.trim().toUpperCase();
  if (!normalized) return null;
  if (["Y", "YES", "TRUE", "1", "가능"].includes(normalized)) return true;
  if (["N", "NO", "FALSE", "0", "불가능"].includes(normalized)) return false;
  return null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const normalized = `${value}`.trim();
  return normalized || undefined;
}

function normalizeItems(items: StandardApiBody["items"]): unknown[] {
  if (Array.isArray(items)) return items;
  const item = items && !Array.isArray(items) && "item" in items ? items.item : undefined;
  if (Array.isArray(item)) return item;
  return item == null ? [] : [item];
}

function normalizeItem(item: unknown): RecreationForest {
  const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return {
    name: readString(record, "rcrfrstNm") ?? "",
    provinceName: readString(record, "ctprvnNm") ?? "",
    type: readString(record, "rcrfrstType"),
    area: readString(record, "rcrfrstAr"),
    capacity: toNumber(record.aceptncCo),
    admissionFee: readString(record, "admfee"),
    stayingAvailable: toBoolean(record.stayngPosblYn),
    mainFacilities: readString(record, "mainFcltyNm"),
    roadAddress: readString(record, "rdnmadr"),
    institutionName: readString(record, "institutionNm"),
    telephoneNumber: readString(record, "telephoneNumber"),
    homepageUrl: readString(record, "homepageUrl"),
    latitude: toNumber(record.latitude),
    longitude: toNumber(record.longitude),
    referenceDate: readString(record, "referenceDate"),
    providerCode: readString(record, "instt_code"),
  };
}

function readNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeRecreationForestsResponse(payload: unknown): RecreationForestList {
  const response = (payload as StandardApiResponse | undefined)?.response;
  const header = response?.header;
  const body = response?.body;
  const resultCode = `${header?.resultCode ?? ""}`;
  const resultMsg = header?.resultMsg ?? "";

  if (resultCode && resultCode !== "00") {
    throw new Error(resultMsg || "Recreation forest API request failed.");
  }

  return {
    resultCode,
    resultMsg,
    pageNo: readNumber(body?.pageNo),
    numOfRows: readNumber(body?.numOfRows),
    totalCount: readNumber(body?.totalCount),
    items: normalizeItems(body?.items).map(normalizeItem),
  };
}

export async function fetchRecreationForests({
  fetchImpl = fetch,
  ...query
}: FetchRecreationForestsOptions): Promise<RecreationForestList> {
  const response = await fetchImpl(buildRecreationForestsUrl(query), {
    headers: {
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Recreation forest API HTTP error: ${response.status}`);
  }

  return normalizeRecreationForestsResponse(await response.json());
}
