import type { FacilityDetailSection, FacilityInfo, ForestEducationProgram } from "@/types";

const ODCLOUD_KIDS_FOREST_URL =
  "https://api.odcloud.kr/api/15081674/v1/uddi:37fa76de-6a65-4535-8275-e8548b33a053";

export type KidsForestCoordinateSeed = {
  name: string;
  address: string;
  status?: string;
  year?: string;
  lat: number;
  lng: number;
};

export type KidsForestFacilityList = {
  items: FacilityInfo[];
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  coordinateMatchedCount: number;
  missingCoordinateCount: number;
};

export type KidsForestQuery = {
  serviceKey: string;
  page?: number;
  perPage?: number;
};

export type FetchKidsForestFacilitiesOptions = KidsForestQuery & {
  coordinateSeeds: KidsForestCoordinateSeed[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type BuildOperationalKidsForestFacilitiesOptions = {
  coordinateSeeds: KidsForestCoordinateSeed[];
  apiItems?: KidsForestApiItem[];
};

export type KidsForestApiItem = {
  시설명?: string;
  주소?: string;
  운영기간?: string;
  전화번호?: string;
  참여방법?: string;
};

type OdcloudKidsForestRawResponse = {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: KidsForestApiItem[];
};

type NormalizedKidsForestItem = {
  name: string;
  address: string;
  period?: string;
  tel?: string;
  participationMethod?: string;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeMatchKey(value: string | undefined): string {
  return clean(value).replace(/\s+/g, "").replace(/[()_-]/g, "").toLowerCase();
}

function normalizeIdKey(value: string | undefined): string {
  return normalizeMatchKey(value).replace(/[^0-9a-z가-힣]/g, "");
}

function unique(values: Array<string | undefined>): string[] {
  return [
    ...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value)),
  ];
}

export function formatKidsForestOperatingPeriod(value: string | undefined): string | undefined {
  const period = clean(value);
  if (!period) return undefined;

  const yearMonthRange = period.match(
    /^(\d{4})[.\-/년\s]*(0?[1-9]|1[0-2])\s*[-~]\s*(?:\d{4}[.\-/년\s]*)?(0?[1-9]|1[0-2])(?:월)?$/,
  );
  if (!yearMonthRange) return period;

  const startMonth = Number(yearMonthRange[2]);
  const endMonth = Number(yearMonthRange[3]);
  return `${startMonth}월~${endMonth}월`;
}

export function buildKidsForestUrl({ serviceKey, page = 1, perPage = 1000 }: KidsForestQuery) {
  const params = new URLSearchParams({
    page: `${page}`,
    perPage: `${perPage}`,
    serviceKey: serviceKey.trim(),
  });

  return `${ODCLOUD_KIDS_FOREST_URL}?${params.toString()}`;
}

function normalizeKidsForestItem(raw: KidsForestApiItem): NormalizedKidsForestItem | null {
  const name = clean(raw.시설명);
  const address = clean(raw.주소);
  if (!name || !address) return null;

  return {
    name,
    address,
    period: formatKidsForestOperatingPeriod(raw.운영기간),
    tel: clean(raw.전화번호) || undefined,
    participationMethod: clean(raw.참여방법) || undefined,
  };
}

type KidsForestApiItemIndex = {
  byAddress: Map<string, NormalizedKidsForestItem>;
  byUniqueName: Map<string, NormalizedKidsForestItem>;
};

function buildKidsForestApiItemIndex(apiItems: KidsForestApiItem[] = []): KidsForestApiItemIndex {
  const byAddress = new Map<string, NormalizedKidsForestItem>();
  const byName = new Map<string, NormalizedKidsForestItem[]>();

  for (const raw of apiItems) {
    const item = normalizeKidsForestItem(raw);
    if (!item) continue;

    const addressKey = normalizeMatchKey(item.address);
    if (addressKey && !byAddress.has(addressKey)) {
      byAddress.set(addressKey, item);
    }

    const nameKey = normalizeMatchKey(item.name);
    if (nameKey) {
      byName.set(nameKey, [...(byName.get(nameKey) ?? []), item]);
    }
  }

  const byUniqueName = new Map<string, NormalizedKidsForestItem>();
  for (const [nameKey, items] of byName) {
    if (items.length === 1) {
      byUniqueName.set(nameKey, items[0]);
    }
  }

  return { byAddress, byUniqueName };
}

function findApiItemForCoordinateSeed(
  seed: KidsForestCoordinateSeed,
  apiItemIndex: KidsForestApiItemIndex,
): NormalizedKidsForestItem | undefined {
  return (
    apiItemIndex.byAddress.get(normalizeMatchKey(seed.address)) ??
    apiItemIndex.byUniqueName.get(normalizeMatchKey(seed.name))
  );
}

type CoordinateIndex = {
  byAddress: Map<string, KidsForestCoordinateSeed>;
  byUniqueName: Map<string, KidsForestCoordinateSeed>;
};

function buildCoordinateIndex(coordinateSeeds: KidsForestCoordinateSeed[]): CoordinateIndex {
  const byAddress = new Map<string, KidsForestCoordinateSeed>();
  const byName = new Map<string, KidsForestCoordinateSeed[]>();

  for (const seed of coordinateSeeds) {
    const addressKey = normalizeMatchKey(seed.address);
    if (addressKey && !byAddress.has(addressKey)) {
      byAddress.set(addressKey, seed);
    }

    const nameKey = normalizeMatchKey(seed.name);
    if (nameKey) {
      byName.set(nameKey, [...(byName.get(nameKey) ?? []), seed]);
    }
  }

  const byUniqueName = new Map<string, KidsForestCoordinateSeed>();
  for (const [nameKey, seeds] of byName) {
    if (seeds.length === 1) {
      byUniqueName.set(nameKey, seeds[0]);
    }
  }

  return { byAddress, byUniqueName };
}

function findCoordinateSeed(
  item: NormalizedKidsForestItem,
  coordinateIndex: CoordinateIndex,
): KidsForestCoordinateSeed | undefined {
  return (
    coordinateIndex.byAddress.get(normalizeMatchKey(item.address)) ??
    coordinateIndex.byUniqueName.get(normalizeMatchKey(item.name))
  );
}

function detailSectionsForKidsForest(
  item: NormalizedKidsForestItem,
  seed: KidsForestCoordinateSeed,
): FacilityDetailSection[] {
  return [
    {
      title: "유아숲체험원 안내",
      items: [
        { label: "운영기간", value: item.period ?? "" },
        { label: "참여방법", value: item.participationMethod ?? "" },
        { label: "운영현황", value: seed.status ?? "" },
        { label: "전화번호", value: item.tel ?? "" },
      ].filter((entry) => entry.value),
    },
    {
      title: "공공데이터 위치 정보",
      items: [
        { label: "주소", value: item.address },
        { label: "좌표 출처", value: "유아숲체험원 UTM-K SHP 좌표 변환" },
        { label: "조성연도", value: seed.year ?? "" },
      ].filter((entry) => entry.value),
    },
  ];
}

function educationProgramForKidsForest(item: NormalizedKidsForestItem): ForestEducationProgram {
  return {
    title: "유아숲체험원 참여 안내",
    content: "",
    facilityName: item.name,
    address: item.address,
    period: item.period,
    tel: item.tel,
    participationMethod: item.participationMethod,
    category: "유아숲체험",
  };
}

function facilityIdForKidsForest(item: NormalizedKidsForestItem, seenIds: Map<string, number>) {
  const baseId = `kids-forest-${normalizeIdKey(item.name) || normalizeIdKey(item.address)}`;
  const seenCount = seenIds.get(baseId) ?? 0;
  seenIds.set(baseId, seenCount + 1);
  return seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`;
}

function isOperationalCoordinateSeed(seed: KidsForestCoordinateSeed): boolean {
  return clean(seed.status) === "운영";
}

function coordinateSeedToNormalizedItem(seed: KidsForestCoordinateSeed): NormalizedKidsForestItem {
  return {
    name: seed.name,
    address: seed.address,
  };
}

export function buildOperationalKidsForestFacilitiesFromCoordinateSeeds({
  coordinateSeeds,
  apiItems,
}: BuildOperationalKidsForestFacilitiesOptions): KidsForestFacilityList {
  const seenIds = new Map<string, number>();
  const operationalSeeds = coordinateSeeds.filter(isOperationalCoordinateSeed);
  const apiItemIndex = buildKidsForestApiItemIndex(apiItems);
  const items = operationalSeeds.map((seed) => {
    const item = findApiItemForCoordinateSeed(seed, apiItemIndex) ?? coordinateSeedToNormalizedItem(seed);

    return {
      id: facilityIdForKidsForest(item, seenIds),
      name: item.name,
      type: "kids_forest",
      address: item.address,
      lat: seed.lat,
      lng: seed.lng,
      tel: item.tel,
      operatingHours: item.period,
      intro: unique([
        "아이 동반 산림교육을 위한 유아숲체험원입니다.",
        item.period ? `운영기간: ${item.period}` : undefined,
        item.participationMethod ? `참여방법: ${item.participationMethod}` : undefined,
        seed.year ? `조성연도: ${seed.year}` : undefined,
        "운영현황: 운영",
      ]).join(" · "),
      programs: unique(["유아숲체험", item.participationMethod]),
      trails: [],
      accessibility: {
        wheelchair: false,
        stroller: true,
        parking: false,
        restroom: false,
        elevator: false,
        helpdog: false,
      },
      detailSections: detailSectionsForKidsForest(item, seed),
      educationPrograms: [educationProgramForKidsForest(item)],
    } satisfies FacilityInfo;
  });

  return {
    items,
    page: 1,
    perPage: items.length,
    totalCount: coordinateSeeds.length,
    currentCount: items.length,
    matchCount: items.length,
    coordinateMatchedCount: items.length,
    missingCoordinateCount: coordinateSeeds.length - items.length,
  };
}

export function mergeKidsForestFacilities(
  response: OdcloudKidsForestRawResponse,
  coordinateSeeds: KidsForestCoordinateSeed[],
): KidsForestFacilityList {
  const coordinateIndex = buildCoordinateIndex(coordinateSeeds);
  const seenIds = new Map<string, number>();
  const normalizedItems = (response.data ?? []).flatMap((raw) => {
    const item = normalizeKidsForestItem(raw);
    return item ? [item] : [];
  });

  const items = normalizedItems.flatMap((item) => {
    if (
      item.period?.includes("미운영") ||
      item.participationMethod?.includes("미운영")
    ) {
      return [];
    }

    const seed = findCoordinateSeed(item, coordinateIndex);
    if (!seed || seed.status?.includes("미운영")) return [];

    return [
      {
        id: facilityIdForKidsForest(item, seenIds),
        name: item.name,
        type: "kids_forest",
        address: item.address,
        lat: seed.lat,
        lng: seed.lng,
        tel: item.tel,
        operatingHours: item.period,
        intro: unique([
          "아이 동반 산림교육을 위한 유아숲체험원입니다.",
          item.period ? `운영기간: ${item.period}` : undefined,
          item.participationMethod ? `참여방법: ${item.participationMethod}` : undefined,
        ]).join(" · "),
        programs: unique(["유아숲체험", item.participationMethod]),
        trails: [],
        accessibility: {
          wheelchair: false,
          stroller: true,
          parking: false,
          restroom: false,
          elevator: false,
          helpdog: false,
        },
        detailSections: detailSectionsForKidsForest(item, seed),
        educationPrograms: [educationProgramForKidsForest(item)],
      } satisfies FacilityInfo,
    ];
  });

  return {
    items,
    page: response.page,
    perPage: response.perPage,
    totalCount: response.totalCount,
    currentCount: response.currentCount,
    matchCount: response.matchCount,
    coordinateMatchedCount: items.length,
    missingCoordinateCount: Math.max(0, normalizedItems.length - items.length),
  };
}

export async function fetchKidsForestFacilities({
  serviceKey,
  page = 1,
  perPage = 1000,
  coordinateSeeds,
  fetchImpl = fetch,
  timeoutMs = 10000,
}: FetchKidsForestFacilitiesOptions): Promise<KidsForestFacilityList> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildKidsForestUrl({ serviceKey, page, perPage }), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Kids forest API HTTP error: ${response.status}`);
    }

    const payload = (await response.json()) as OdcloudKidsForestRawResponse;
    return mergeKidsForestFacilities(payload, coordinateSeeds);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Kids forest API request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchKidsForestApiItems({
  serviceKey,
  page = 1,
  perPage = 1000,
  fetchImpl = fetch,
  timeoutMs = 10000,
}: KidsForestQuery & {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<OdcloudKidsForestRawResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildKidsForestUrl({ serviceKey, page, perPage }), {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Kids forest API HTTP error: ${response.status}`);
    }

    return (await response.json()) as OdcloudKidsForestRawResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Kids forest API request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
