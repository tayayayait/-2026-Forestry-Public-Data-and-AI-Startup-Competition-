// ──────────────────────────────────────────────────────────────
// TourAPI 상세 조회 API
// detailCommon, detailIntro, detailInfo, detailImage, searchKeyword
// ──────────────────────────────────────────────────────────────

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";
const TOUR_API_MOBILE_APP = "ForestTherapyAI";

/* ── 타입 정의 ── */

export type TourDetailCommon = {
  contentId: string;
  contentTypeId: string;
  title: string;
  address: string;
  overview: string;
  homepage?: string;
  tel?: string;
  firstImage?: string;
  firstImage2?: string;
  mapX?: number;
  mapY?: number;
};

export type TourDetailIntro = {
  contentId: string;
  contentTypeId: string;
  distance?: string;
  taketime?: string;
  theme?: string;
  infoCenter?: string;
  parking?: string;
  restDate?: string;
  useTime?: string;
  useFee?: string;
};

export type TourDetailInfoItem = {
  subNum: number;
  subName: string;
  subDetailOverview: string;
  subDetailImg?: string;
};

export type TourDetailImage = {
  originImgUrl: string;
  smallImageUrl: string;
  imgName?: string;
  serialNum?: string;
};

export type TourSearchResult = {
  contentId: string;
  contentTypeId: string;
  title: string;
  address: string;
  firstImage?: string;
  mapX?: number;
  mapY?: number;
};

export type TourFacilityDetail = {
  common: TourDetailCommon | null;
  intro: TourDetailIntro | null;
  infoItems: TourDetailInfoItem[];
  images: TourDetailImage[];
};

/* ── 유틸리티 ── */

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value == null) return undefined;
  const normalized = `${value}`.trim();
  return normalized || undefined;
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanServiceKey(key: string): string {
  return key.trim().replace(/^["']|["']$/g, "");
}

type StandardResponseBody = {
  items?: unknown[] | { item?: unknown | unknown[] };
};

type StandardApiResponse = {
  response?: {
    header?: { resultCode?: string | number; resultMsg?: string };
    body?: StandardResponseBody;
  };
};

function normalizeItems(items: StandardResponseBody["items"]): unknown[] {
  if (Array.isArray(items)) return items;
  const item = items && !Array.isArray(items) && "item" in items ? items.item : undefined;
  if (Array.isArray(item)) return item;
  return item == null ? [] : [item];
}

function extractItems(payload: unknown): unknown[] {
  const response = (payload as StandardApiResponse | undefined)?.response;
  const header = response?.header;
  const resultCode = `${header?.resultCode ?? ""}`;

  if (resultCode && resultCode !== "0000") {
    throw new Error(header?.resultMsg || "TourAPI 요청 실패");
  }

  return normalizeItems(response?.body?.items);
}

function buildBaseParams(serviceKey: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("MobileOS", "ETC");
  params.set("MobileApp", TOUR_API_MOBILE_APP);
  params.set("_type", "json");
  return params;
}

function buildUrl(path: string, serviceKey: string, extra: Record<string, string>): string {
  const url = new URL(`${TOUR_API_BASE}${path}`);
  const params = buildBaseParams(serviceKey);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of params.entries()) {
    url.searchParams.set(key, value);
  }
  return `${url.toString()}&serviceKey=${cleanServiceKey(serviceKey)}`;
}

/* ── detailCommon 조회 ── */

function normalizeDetailCommon(item: unknown): TourDetailCommon {
  const r = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const addr = [readString(r, "addr1"), readString(r, "addr2")].filter(Boolean).join(" ");

  return {
    contentId: readString(r, "contentid") ?? "",
    contentTypeId: readString(r, "contenttypeid") ?? "",
    title: readString(r, "title") ?? "",
    address: addr,
    overview: readString(r, "overview") ?? "",
    homepage: readString(r, "homepage"),
    tel: readString(r, "tel"),
    firstImage: readString(r, "firstimage"),
    firstImage2: readString(r, "firstimage2"),
    mapX: toNumber(r.mapx),
    mapY: toNumber(r.mapy),
  };
}

export async function fetchTourDetailCommon(options: {
  serviceKey: string;
  contentId: string;
  fetchImpl?: typeof fetch;
}): Promise<TourDetailCommon | null> {
  const { serviceKey, contentId, fetchImpl = fetch } = options;
  const url = buildUrl("/detailCommon2", serviceKey, {
    contentId,
    defaultYN: "Y",
    firstImageYN: "Y",
    areacodeYN: "Y",
    addrinfoYN: "Y",
    overviewYN: "Y",
  });

  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`TourAPI detailCommon HTTP ${response.status}`);

  const items = extractItems(await response.json());
  return items.length > 0 ? normalizeDetailCommon(items[0]) : null;
}

/* ── detailIntro 조회 ── */

function normalizeDetailIntro(item: unknown): TourDetailIntro {
  const r = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    contentId: readString(r, "contentid") ?? "",
    contentTypeId: readString(r, "contenttypeid") ?? "",
    distance: readString(r, "distance"),
    taketime: readString(r, "taketime"),
    theme: readString(r, "theme"),
    infoCenter:
      readString(r, "infocenter") ??
      readString(r, "infocenterculture") ??
      readString(r, "infocenterleports"),
    parking:
      readString(r, "parking") ??
      readString(r, "parkingculture") ??
      readString(r, "parkingleports"),
    restDate:
      readString(r, "restdate") ??
      readString(r, "restdateculture") ??
      readString(r, "restdateleports"),
    useTime:
      readString(r, "usetime") ??
      readString(r, "usetimeculture") ??
      readString(r, "usetimeleports"),
    useFee:
      readString(r, "usefee") ?? readString(r, "usefeeleports"),
  };
}

export async function fetchTourDetailIntro(options: {
  serviceKey: string;
  contentId: string;
  contentTypeId: string;
  fetchImpl?: typeof fetch;
}): Promise<TourDetailIntro | null> {
  const { serviceKey, contentId, contentTypeId, fetchImpl = fetch } = options;
  const url = buildUrl("/detailIntro2", serviceKey, { contentId, contentTypeId });

  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`TourAPI detailIntro HTTP ${response.status}`);

  const items = extractItems(await response.json());
  return items.length > 0 ? normalizeDetailIntro(items[0]) : null;
}

/* ── detailInfo 조회 (코스 경유지 등) ── */

function normalizeDetailInfoItem(item: unknown): TourDetailInfoItem {
  const r = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    subNum: readNumber(r.subnum),
    subName: readString(r, "subname") ?? "",
    subDetailOverview: readString(r, "subdetailoverview") ?? "",
    subDetailImg: readString(r, "subdetailimg"),
  };
}

export async function fetchTourDetailInfo(options: {
  serviceKey: string;
  contentId: string;
  contentTypeId: string;
  fetchImpl?: typeof fetch;
}): Promise<TourDetailInfoItem[]> {
  const { serviceKey, contentId, contentTypeId, fetchImpl = fetch } = options;
  const url = buildUrl("/detailInfo2", serviceKey, { contentId, contentTypeId });

  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`TourAPI detailInfo HTTP ${response.status}`);

  return extractItems(await response.json())
    .map(normalizeDetailInfoItem)
    .filter((item) => item.subName);
}

/* ── detailImage 조회 ── */

function normalizeDetailImage(item: unknown): TourDetailImage {
  const r = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    originImgUrl: readString(r, "originimgurl") ?? "",
    smallImageUrl: readString(r, "smallimageurl") ?? "",
    imgName: readString(r, "imgname"),
    serialNum: readString(r, "serialnum"),
  };
}

export async function fetchTourDetailImages(options: {
  serviceKey: string;
  contentId: string;
  fetchImpl?: typeof fetch;
}): Promise<TourDetailImage[]> {
  const { serviceKey, contentId, fetchImpl = fetch } = options;
  const url = buildUrl("/detailImage2", serviceKey, {
    contentId,
    imageYN: "Y",
    subImageYN: "Y",
    numOfRows: "20",
  });

  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`TourAPI detailImage HTTP ${response.status}`);

  return extractItems(await response.json())
    .map(normalizeDetailImage)
    .filter((img) => img.originImgUrl);
}

/* ── searchKeyword 검색 (시설 매칭용) ── */

function normalizeSearchResult(item: unknown): TourSearchResult {
  const r = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const addr = [readString(r, "addr1"), readString(r, "addr2")].filter(Boolean).join(" ");

  return {
    contentId: readString(r, "contentid") ?? "",
    contentTypeId: readString(r, "contenttypeid") ?? "",
    title: readString(r, "title") ?? "",
    address: addr,
    firstImage: readString(r, "firstimage"),
    mapX: toNumber(r.mapx),
    mapY: toNumber(r.mapy),
  };
}

export async function searchTourKeyword(options: {
  serviceKey: string;
  keyword: string;
  contentTypeId?: string;
  numOfRows?: number;
  fetchImpl?: typeof fetch;
}): Promise<TourSearchResult[]> {
  const { serviceKey, keyword, contentTypeId, numOfRows = 5, fetchImpl = fetch } = options;
  const extra: Record<string, string> = {
    keyword,
    numOfRows: `${numOfRows}`,
    pageNo: "1",
    arrange: "A",
  };
  if (contentTypeId) extra.contentTypeId = contentTypeId;

  const url = buildUrl("/searchKeyword2", serviceKey, extra);
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`TourAPI searchKeyword HTTP ${response.status}`);

  return extractItems(await response.json())
    .map(normalizeSearchResult)
    .filter((r) => r.contentId && r.title);
}

/* ── 통합 상세 조회 (한번에 4개 API 호출) ── */

export async function fetchTourFacilityDetail(options: {
  serviceKey: string;
  contentId: string;
  contentTypeId?: string;
  fetchImpl?: typeof fetch;
}): Promise<TourFacilityDetail> {
  const { serviceKey, contentId, fetchImpl = fetch } = options;

  // 먼저 공통 정보를 조회하여 contentTypeId 확인
  const common = await fetchTourDetailCommon({ serviceKey, contentId, fetchImpl });
  const typeId = options.contentTypeId ?? common?.contentTypeId ?? "12";

  // 나머지 3개 API 병렬 호출
  const [intro, infoItems, images] = await Promise.all([
    fetchTourDetailIntro({ serviceKey, contentId, contentTypeId: typeId, fetchImpl }).catch(
      () => null,
    ),
    fetchTourDetailInfo({ serviceKey, contentId, contentTypeId: typeId, fetchImpl }).catch(
      () => [],
    ),
    fetchTourDetailImages({ serviceKey, contentId, fetchImpl }).catch(() => []),
  ]);

  return { common, intro, infoItems, images };
}
