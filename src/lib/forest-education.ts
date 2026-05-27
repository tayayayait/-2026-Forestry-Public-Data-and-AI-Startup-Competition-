import type { ForestEducationProgram, ForestEducationProgramList } from "@/types";

const FOREST_EDUCATION_PROGRAMS_URL =
  "http://api.forest.go.kr/openapi/service/cultureInfoService/frstEduInfoOpenAPI";

export type ForestEducationProgramsQuery = {
  serviceKey: string;
  eduType?: string;
  searchTitl?: string;
  searchCont?: string;
  pageNo?: string | number;
  numOfRows?: string | number;
  page?: string | number;
  perPage?: string | number;
  searchFacilityName?: string;
};

export type FetchForestEducationProgramsOptions = ForestEducationProgramsQuery & {
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

function normalizeServiceKey(serviceKey: string): string {
  return serviceKey.trim().replace(/^["']|["']$/g, "");
}

export function buildForestEducationProgramsUrl({
  serviceKey,
  eduType,
  searchTitl,
  searchCont,
  pageNo,
  numOfRows,
  page,
  perPage,
}: ForestEducationProgramsQuery): string {
  const url = new URL(FOREST_EDUCATION_PROGRAMS_URL);
  appendOptionalParam(url.searchParams, "eduType", eduType);
  appendOptionalParam(url.searchParams, "searchTitl", searchTitl);
  appendOptionalParam(url.searchParams, "searchCont", searchCont);
  appendOptionalParam(url.searchParams, "pageNo", pageNo ?? page ?? 1);
  appendOptionalParam(url.searchParams, "numOfRows", numOfRows ?? perPage ?? 100);

  const query = url.searchParams.toString();
  const encodedParams = query ? `&${query}` : "";
  return `${FOREST_EDUCATION_PROGRAMS_URL}?ServiceKey=${normalizeServiceKey(serviceKey)}${encodedParams}`;
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

function readOptionalTag(xml: string, tagName: string): string | undefined {
  const value = readTag(xml, tagName);
  return value || undefined;
}

function readNumberTag(xml: string, tagName: string): number {
  const parsed = Number.parseInt(readTag(xml, tagName), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readItemBlocks(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1] ?? "");
}

function assertXmlResponse(xml: string): void {
  if (!/<response[\s>]/i.test(xml)) {
    throw new Error("산림교육프로그램 API가 XML 응답을 반환하지 않았습니다.");
  }
}

function assertNormalResponse(xml: string): { resultCode: string; resultMsg: string } {
  const resultCode = readTag(xml, "resultCode");
  const resultMsg = readTag(xml, "resultMsg");
  if (resultCode && !["00", "0000"].includes(resultCode)) {
    throw new Error(resultMsg || "산림교육프로그램 API 요청에 실패했습니다.");
  }
  return { resultCode, resultMsg };
}

function normalizeEducationProgramItem(itemXml: string): ForestEducationProgram {
  const facilityName = readOptionalTag(itemXml, "facnm");
  const title = readOptionalTag(itemXml, "title") ?? facilityName ?? "산림교육 프로그램";

  return {
    title,
    content: readOptionalTag(itemXml, "cont") ?? "",
    registeredAt: readOptionalTag(itemXml, "rgdt"),
    registrar: readOptionalTag(itemXml, "rgter"),
    department: readOptionalTag(itemXml, "post"),
    facilityName,
    address: readOptionalTag(itemXml, "addr"),
    category: readOptionalTag(itemXml, "category"),
    period: readOptionalTag(itemXml, "period"),
    managementAgency: readOptionalTag(itemXml, "mnagnnm"),
    tel: readOptionalTag(itemXml, "tel"),
  };
}

export function normalizeForestEducationProgramsXml(xml: string): ForestEducationProgramList & {
  resultCode: string;
  resultMsg: string;
  pageNo: number;
  numOfRows: number;
} {
  assertXmlResponse(xml);
  const { resultCode, resultMsg } = assertNormalResponse(xml);
  const pageNo = readNumberTag(xml, "pageNo");
  const numOfRows = readNumberTag(xml, "numOfRows");
  const totalCount = readNumberTag(xml, "totalCount");
  const items = readItemBlocks(xml).map(normalizeEducationProgramItem);

  return {
    resultCode,
    resultMsg,
    pageNo,
    numOfRows,
    totalCount,
    items,
  } as ForestEducationProgramList & {
    resultCode: string;
    resultMsg: string;
    pageNo: number;
    numOfRows: number;
  };
}

async function fetchXml(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`산림교육프로그램 API HTTP error: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("산림교육프로그램 API 호출 시간이 초과되었습니다.");
    }
    if (error instanceof TypeError && error.message === "fetch failed") {
      throw new Error("산림교육프로그램 API 연결에 실패했습니다.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchForestEducationPrograms({
  fetchImpl = fetch,
  timeoutMs = 10000,
  ...query
}: FetchForestEducationProgramsOptions): Promise<ForestEducationProgramList> {
  const xml = await fetchXml(buildForestEducationProgramsUrl(query), fetchImpl, timeoutMs);
  return normalizeForestEducationProgramsXml(xml);
}
