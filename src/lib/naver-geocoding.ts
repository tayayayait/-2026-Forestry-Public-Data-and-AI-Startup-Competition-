import type { GeocodingResult } from "@/types";

const NAVER_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

type NaverGeocodeAddress = {
  roadAddress?: string;
  jibunAddress?: string;
  x?: string;
  y?: string;
};

type NaverGeocodePayload = {
  status?: string;
  errorMessage?: string;
  addresses?: NaverGeocodeAddress[];
};

export type FetchNaverGeocodeOptions = {
  query: string;
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function buildNaverGeocodeUrl(query: string): string {
  const params = new URLSearchParams({ query });
  return `${NAVER_GEOCODE_URL}?${params.toString()}`;
}

function normalizeFirstAddress(
  query: string,
  payload: NaverGeocodePayload,
): GeocodingResult | null {
  const firstAddress = payload.addresses?.[0];
  if (!firstAddress) return null;

  const lat = Number.parseFloat(firstAddress.y ?? "");
  const lng = Number.parseFloat(firstAddress.x ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    query,
    roadAddress: firstAddress.roadAddress || undefined,
    jibunAddress: firstAddress.jibunAddress || undefined,
    lat,
    lng,
  };
}

export async function fetchNaverGeocode({
  query,
  clientId,
  clientSecret,
  fetchImpl = fetch,
  timeoutMs = 10000,
}: FetchNaverGeocodeOptions): Promise<GeocodingResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildNaverGeocodeUrl(query), {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Naver Geocoding HTTP 오류: ${response.status}`);
    }

    const payload = (await response.json()) as NaverGeocodePayload;
    if (payload.status && payload.status !== "OK") {
      throw new Error(payload.errorMessage || "Naver Geocoding 요청에 실패했습니다.");
    }

    return normalizeFirstAddress(query, payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Naver Geocoding 요청 시간이 초과되었습니다.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
