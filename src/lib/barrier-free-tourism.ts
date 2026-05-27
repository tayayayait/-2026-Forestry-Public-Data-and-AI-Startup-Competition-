import type { FacilityAccessibility, NearbyPlace } from "@/types";

const BARRIER_FREE_TOUR_DETAIL_URL =
  "https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2";
const TOUR_API_MOBILE_APP = "ForestTherapyAI";

export type BarrierFreeTourDetailQuery = {
  serviceKey: string;
  contentId: string;
  pageNo?: string | number;
  numOfRows?: string | number;
};

export type FetchBarrierFreeTourAccessibilityOptions = BarrierFreeTourDetailQuery & {
  fetchImpl?: typeof fetch;
};

export type BarrierFreeTourAccessibility = {
  contentId?: string;
  accessibility: FacilityAccessibility;
  notes: string[];
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

const DETAIL_FIELDS = [
  "parking",
  "publictransport",
  "route",
  "ticketoffice",
  "promotion",
  "wheelchair",
  "exit",
  "elevator",
  "restroom",
  "auditorium",
  "room",
  "handicapetc",
  "braileblock",
  "helpdog",
  "guidehuman",
  "audioguide",
  "bigprint",
  "brailepromotion",
  "guidesystem",
  "blindhandicapetc",
  "signguide",
  "videoguide",
  "hearingroom",
  "hearinghandicapetc",
  "stroller",
  "lactationroom",
  "babysparechair",
  "infantsfamilyetc",
] as const;

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value == null || value === "") return;
  params.set(key, `${value}`);
}

export function buildBarrierFreeTourDetailUrl({
  serviceKey,
  contentId,
  pageNo = 1,
  numOfRows = 10,
}: BarrierFreeTourDetailQuery): string {
  const url = new URL(BARRIER_FREE_TOUR_DETAIL_URL);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", TOUR_API_MOBILE_APP);
  url.searchParams.set("_type", "json");
  appendOptionalParam(url.searchParams, "pageNo", pageNo);
  appendOptionalParam(url.searchParams, "numOfRows", numOfRows);
  url.searchParams.set("contentId", contentId);
  const rawKey = serviceKey.trim().replace(/^["']|["']$/g, "");
  return `${url.toString()}&serviceKey=${rawKey}`;
}

function normalizeItems(items: StandardTourApiBody["items"]): unknown[] {
  if (Array.isArray(items)) return items;
  const item = items && !Array.isArray(items) && "item" in items ? items.item : undefined;
  if (Array.isArray(item)) return item;
  return item == null ? [] : [item];
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const normalized = `${value}`
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || undefined;
}

function hasPositiveText(value: unknown): boolean {
  const text = `${value ?? ""}`
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return !/(없음|없슴|불가|미제공|해당없음|해당 없음|^-+$)/.test(text);
}

function accessibilityFromRecord(record: Record<string, unknown>): FacilityAccessibility {
  return {
    parking: hasPositiveText(record.parking),
    wheelchair:
      hasPositiveText(record.wheelchair) ||
      hasPositiveText(record.route) ||
      hasPositiveText(record.exit),
    restroom: hasPositiveText(record.restroom),
    elevator: hasPositiveText(record.elevator),
    helpdog: hasPositiveText(record.helpdog),
    stroller:
      hasPositiveText(record.stroller) ||
      hasPositiveText(record.lactationroom) ||
      hasPositiveText(record.babysparechair),
  };
}

function notesFromRecord(record: Record<string, unknown>): string[] {
  const notes: string[] = [];
  for (const field of DETAIL_FIELDS) {
    const note = readString(record, field);
    if (note && hasPositiveText(note) && !notes.includes(note)) {
      notes.push(note);
    }
  }
  return notes;
}

export function normalizeBarrierFreeTourDetailResponse(
  payload: unknown,
): BarrierFreeTourAccessibility {
  const response = (payload as StandardTourApiResponse | undefined)?.response;
  const header = response?.header;
  const body = response?.body;
  const resultCode = `${header?.resultCode ?? ""}`;
  const resultMsg = header?.resultMsg ?? "";

  if (resultCode && resultCode !== "0000") {
    throw new Error(resultMsg || "Barrier-free TourAPI request failed.");
  }

  const record = normalizeItems(body?.items).find((item) => item && typeof item === "object") ?? {};
  const normalizedRecord = record as Record<string, unknown>;

  return {
    contentId: readString(normalizedRecord, "contentid"),
    accessibility: accessibilityFromRecord(normalizedRecord),
    notes: notesFromRecord(normalizedRecord),
  };
}

export async function fetchBarrierFreeTourAccessibility({
  fetchImpl = fetch,
  ...query
}: FetchBarrierFreeTourAccessibilityOptions): Promise<BarrierFreeTourAccessibility> {
  const response = await fetchImpl(buildBarrierFreeTourDetailUrl(query));
  if (!response.ok) {
    throw new Error(`Barrier-free TourAPI HTTP error: ${response.status}`);
  }
  return normalizeBarrierFreeTourDetailResponse(await response.json());
}

export async function enrichNearbyPlacesWithBarrierFreeAccessibility(
  places: NearbyPlace[],
  options: { serviceKey: string; fetchImpl?: typeof fetch },
): Promise<NearbyPlace[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const enriched = await Promise.all(
    places.map(async (place) => {
      if (!place.contentId) return place;

      try {
        const detail = await fetchBarrierFreeTourAccessibility({
          serviceKey: options.serviceKey,
          contentId: place.contentId,
          fetchImpl,
        });
        const hasAnyFlag = Object.values(detail.accessibility).some(Boolean);
        if (!hasAnyFlag && detail.notes.length === 0) return place;

        return {
          ...place,
          accessibility: detail.accessibility,
          accessibilityNotes: detail.notes,
        };
      } catch {
        return place;
      }
    }),
  );

  return enriched;
}
