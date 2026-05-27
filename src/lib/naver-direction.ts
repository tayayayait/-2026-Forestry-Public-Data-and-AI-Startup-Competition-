export interface DrivingRouteGuide {
  lat: number;
  lng: number;
  distance: number;
  guidance: string;
  type: number;
}

export interface DrivingRouteResult {
  distance: number;
  duration: number;
  taxiFare: number;
  tollFare: number;
  path: Array<{ lat: number; lng: number }>;
  guides: DrivingRouteGuide[];
}

const NAVER_DIRECTION_URL = "https://maps.apigw.ntruss.com/map-direction/v1/driving";

type LatLng = {
  lat: number;
  lng: number;
};

type NaverDirectionGuide = {
  pointIndex?: number;
  distance?: number;
  instructions?: string;
  type?: number;
};

type NaverDirectionRoute = {
  summary?: {
    distance?: number;
    duration?: number;
    taxiFare?: number;
    tollFare?: number;
  };
  path?: number[][];
  guide?: NaverDirectionGuide[];
};

type NaverDirectionPayload = {
  code?: number;
  message?: string;
  route?: {
    traoptimal?: NaverDirectionRoute[];
  };
  error?: {
    errorCode?: string;
    message?: string;
    details?: string;
  };
};

export class NaverDirectionApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly details?: string;

  constructor({
    status,
    message,
    errorCode,
    details,
  }: {
    status: number;
    message: string;
    errorCode?: string;
    details?: string;
  }) {
    super(message);
    this.name = "NaverDirectionApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export function buildNaverDirectionUrl(origin: LatLng, destination: LatLng): string {
  const params = new URLSearchParams({
    start: `${origin.lng},${origin.lat}`,
    goal: `${destination.lng},${destination.lat}`,
  });
  return `${NAVER_DIRECTION_URL}?${params.toString()}`;
}

function parseJson(text: string): NaverDirectionPayload | null {
  try {
    return JSON.parse(text) as NaverDirectionPayload;
  } catch {
    return null;
  }
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizePath(rawPath: number[][] | undefined): Array<{ lat: number; lng: number }> {
  if (!rawPath) return [];

  return rawPath.flatMap((coord) => {
    const lng = toFiniteNumber(coord[0]);
    const lat = toFiniteNumber(coord[1]);
    return lat === null || lng === null ? [] : [{ lat, lng }];
  });
}

function normalizeDrivingRoute(route: NaverDirectionRoute | undefined): DrivingRouteResult | null {
  const summary = route?.summary;
  const distance = toFiniteNumber(summary?.distance);
  const durationMs = toFiniteNumber(summary?.duration);
  const path = normalizePath(route?.path);

  if (distance === null || durationMs === null || path.length === 0) {
    return null;
  }

  const guides =
    route?.guide?.flatMap((guide): DrivingRouteGuide[] => {
      if (typeof guide.pointIndex !== "number") return [];
      const point = path[guide.pointIndex];
      if (!point) return [];

      return [
        {
          lat: point.lat,
          lng: point.lng,
          distance: toFiniteNumber(guide.distance) ?? 0,
          guidance: guide.instructions ?? "",
          type: toFiniteNumber(guide.type) ?? 0,
        },
      ];
    }) ?? [];

  return {
    distance,
    duration: Math.round(durationMs / 1000),
    taxiFare: toFiniteNumber(summary?.taxiFare) ?? 0,
    tollFare: toFiniteNumber(summary?.tollFare) ?? 0,
    path,
    guides,
  };
}

export type FetchNaverDrivingRouteOptions = {
  origin: LatLng;
  destination: LatLng;
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function fetchNaverDrivingRouteFromNaver({
  origin,
  destination,
  clientId,
  clientSecret,
  fetchImpl = fetch,
  timeoutMs = 10000,
}: FetchNaverDrivingRouteOptions): Promise<DrivingRouteResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildNaverDirectionUrl(origin, destination), {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = parseJson(text);

    if (!response.ok) {
      throw new NaverDirectionApiError({
        status: response.status,
        errorCode: payload?.error?.errorCode,
        details: payload?.error?.details,
        message:
          payload?.error?.details ??
          payload?.error?.message ??
          `Naver Direction HTTP error: ${response.status}`,
      });
    }

    if (!payload) {
      throw new NaverDirectionApiError({
        status: response.status,
        message: "Naver Direction returned an invalid JSON response.",
      });
    }

    if (payload.code !== undefined && payload.code !== 0) {
      return null;
    }

    return normalizeDrivingRoute(payload.route?.traoptimal?.[0]);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new NaverDirectionApiError({
        status: 504,
        message: "Naver Direction request timed out.",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
