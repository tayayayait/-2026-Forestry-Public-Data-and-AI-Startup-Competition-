import type { HealingForestList, HealingForestStatus } from "@/types";

const HEALING_FORESTS_URL =
  "https://api.odcloud.kr/api/15107928/v1/uddi:bb6d1462-c89b-4007-9eaa-a0ced9e50fd9";

export type HealingForestsQuery = {
  serviceKey: string;
  page?: string | number;
  perPage?: string | number;
};

export type FetchHealingForestsOptions = HealingForestsQuery & {
  fetchImpl?: typeof fetch;
};

type OdcloudErrorResponse = {
  code?: number;
  msg?: string;
};

type OdcloudHealingForestItem = {
  연번?: string | number;
  지역?: string;
  시설명?: string;
  주소?: string;
  전화번호?: string;
  홈페이지?: string;
  참여방법?: string;
  관리주체?: string;
};

type OdcloudHealingForestResponse = {
  page?: string | number;
  perPage?: string | number;
  totalCount?: string | number;
  currentCount?: string | number;
  matchCount?: string | number;
  data?: OdcloudHealingForestItem[];
};

export function buildHealingForestsUrl({
  serviceKey,
  page = 1,
  perPage = 10,
}: HealingForestsQuery): string {
  const url = new URL(HEALING_FORESTS_URL);
  url.searchParams.set("page", `${page}`);
  url.searchParams.set("perPage", `${perPage}`);
  url.searchParams.set("returnType", "JSON");
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

function readNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readNullableNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const normalized = `${value}`.trim();
  return normalized || undefined;
}

function normalizeItem(item: OdcloudHealingForestItem): HealingForestStatus {
  return {
    serialNumber: readNullableNumber(item.연번),
    region: readString(item.지역) ?? "",
    facilityName: readString(item.시설명) ?? "",
    address: readString(item.주소) ?? "",
    telephoneNumber: readString(item.전화번호),
    homepage: readString(item.홈페이지),
    participationMethod: readString(item.참여방법),
    operator: readString(item.관리주체),
  };
}

export function normalizeHealingForestsResponse(payload: unknown): HealingForestList {
  const errorPayload = payload as OdcloudErrorResponse;
  if (typeof errorPayload.code === "number" && errorPayload.code < 0) {
    throw new Error(errorPayload.msg || "Healing forest API request failed.");
  }

  const response = payload as OdcloudHealingForestResponse;
  return {
    page: readNumber(response.page),
    perPage: readNumber(response.perPage),
    totalCount: readNumber(response.totalCount),
    currentCount: readNumber(response.currentCount),
    matchCount: readNumber(response.matchCount),
    items: Array.isArray(response.data) ? response.data.map(normalizeItem) : [],
  };
}

export async function fetchHealingForests({
  fetchImpl = fetch,
  ...query
}: FetchHealingForestsOptions): Promise<HealingForestList> {
  const url = buildHealingForestsUrl(query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (payload) {
        return normalizeHealingForestsResponse(payload);
      }
      throw new Error(`Healing forest API HTTP error: ${response.status}`);
    }

    return normalizeHealingForestsResponse(payload);
  } finally {
    clearTimeout(timeoutId);
  }
}
