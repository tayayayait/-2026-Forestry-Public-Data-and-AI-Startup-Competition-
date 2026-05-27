import type { TraditionalVillageForest, TraditionalVillageForestList } from "@/types";

const TRADITIONAL_VILLAGE_FORESTS_URL =
  "http://api.forest.go.kr/openapi/service/cultureInfoService/traVllgFrstOpenAPI";

export type TraditionalVillageForestsQuery = {
  serviceKey: string;
  searchVllgNm?: string;
  searchPlcNm?: string;
  pageNo?: string | number;
  numOfRows?: string | number;
};

export type FetchTraditionalVillageForestsOptions = TraditionalVillageForestsQuery & {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value == null || value === "") return;
  params.set(key, `${value}`);
}

function normalizeLegacyServiceKey(serviceKey: string): string {
  return serviceKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/=+$/, "");
}

export function buildTraditionalVillageForestsUrl({
  serviceKey,
  searchVllgNm,
  searchPlcNm,
  pageNo = 1,
  numOfRows = 10,
}: TraditionalVillageForestsQuery): string {
  const params = new URLSearchParams();
  appendOptionalParam(params, "searchVllgNm", searchVllgNm);
  appendOptionalParam(params, "searchPlcNm", searchPlcNm);
  appendOptionalParam(params, "pageNo", pageNo);
  appendOptionalParam(params, "numOfRows", numOfRows);

  const query = params.toString();
  return `${TRADITIONAL_VILLAGE_FORESTS_URL}?ServiceKey=${normalizeLegacyServiceKey(serviceKey)}${
    query ? `&${query}` : ""
  }`;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .trim();
}

function readTag(xml: string, tagName: string): string {
  const match = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`).exec(xml);
  return match ? decodeXmlEntities(match[1]) : "";
}

function readNumberTag(xml: string, tagName: string): number {
  const value = readTag(xml, tagName);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readOptionalNumberTag(xml: string, tagName: string): number | null {
  const value = readTag(xml, tagName);
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readItemBlocks(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
}

function normalizeItem(itemXml: string): TraditionalVillageForest {
  return {
    name: readTag(itemXml, "travllgfrstnm"),
    address: readTag(itemXml, "matrlnmplc") || undefined,
    mainTreeSpecies: readTag(itemXml, "mainfoftrnm") || undefined,
    mainForestType: readTag(itemXml, "mainfrtpnm") || undefined,
    historyContent: readTag(itemXml, "histrexmnncont") || undefined,
    cultureContent: readTag(itemXml, "clturexmnncont") || undefined,
    zoneAreaSquareMeters: readOptionalNumberTag(itemXml, "zonearea"),
  };
}

export function normalizeTraditionalVillageForestsXml(xml: string): TraditionalVillageForestList {
  const resultCode = readTag(xml, "resultCode");
  const resultMsg = readTag(xml, "resultMsg");

  if (resultCode && resultCode !== "00" && resultCode !== "0000") {
    throw new Error(resultMsg || "전통마을숲 정보를 조회하지 못했습니다.");
  }

  return {
    resultCode,
    resultMsg,
    pageNo: readNumberTag(xml, "pageNo"),
    numOfRows: readNumberTag(xml, "numOfRows"),
    totalCount: readNumberTag(xml, "totalCount"),
    items: readItemBlocks(xml).map(normalizeItem),
  };
}

export async function fetchTraditionalVillageForests({
  fetchImpl = fetch,
  timeoutMs = 70000,
  ...query
}: FetchTraditionalVillageForestsOptions): Promise<TraditionalVillageForestList> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildTraditionalVillageForestsUrl(query), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`전통마을숲 HTTP 오류: ${response.status}`);
    }

    return normalizeTraditionalVillageForestsXml(await response.text());
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("전통마을숲 API 호출 시간이 초과되었습니다.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
