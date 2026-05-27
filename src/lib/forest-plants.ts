import type { ForestPlantImageList, ForestPlantStory, ForestPlantStoryList, PlantInfo } from "@/types";

type ForestPlantsQuery = {
  searchWrd?: string | number;
  pageNo?: string | number;
  numOfRows?: string | number;
};

type ForestPlantCsvRecord = {
  "숲이야기순번"?: string | number;
  "구분"?: string;
  "식물명"?: string;
  "영문명"?: string;
  "안내"?: string;
  "학명"?: string;
  "식물분류군명"?: string;
  "서식장소"?: string;
  "식물의일생"?: string;
  "식물이야기설명"?: string;
  "식물자료제공"?: string;
  "등록일"?: string;
};

function toPositiveInteger(value: string | number | undefined, fallback: number): number {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeCell(value: string | number | undefined): string | undefined {
  const normalized = `${value ?? ""}`.replace(/^\uFEFF/u, "").replace(/\s+/gu, " ").trim();
  return normalized || undefined;
}

function csvRowsToRecords(rows: string[][]): ForestPlantCsvRecord[] {
  const [headerRow, ...dataRows] = rows.filter((row) => row.some((value) => value.trim() !== ""));
  if (!headerRow) return [];

  const headers = headerRow.map((header) => header.replace(/^\uFEFF/u, "").trim());
  return dataRows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header, normalizeCell(row[index]) ?? ""]),
    ) as ForestPlantCsvRecord,
  );
}

function normalizePlantRecord(record: ForestPlantCsvRecord): ForestPlantStory {
  return {
    id: normalizeCell(record["숲이야기순번"]) ?? "",
    category: normalizeCell(record["구분"]),
    name: normalizeCell(record["식물명"]) ?? "",
    englishName: normalizeCell(record["영문명"]),
    guide: normalizeCell(record["안내"]),
    scientificName: normalizeCell(record["학명"]),
    className: normalizeCell(record["식물분류군명"]),
    habitat: normalizeCell(record["서식장소"]),
    lifetime: normalizeCell(record["식물의일생"]),
    offer: normalizeCell(record["식물자료제공"]),
    registeredAt: normalizeCell(record["등록일"]),
    story: normalizeCell(record["식물이야기설명"]),
  };
}

export function normalizeForestPlantsCsv(text: string): ForestPlantStoryList {
  const items = csvRowsToRecords(parseCsv(text))
    .map(normalizePlantRecord)
    .filter((item) => item.id && item.name);

  return {
    resultCode: "CSV",
    resultMsg: "OK",
    pageNo: 1,
    numOfRows: items.length,
    totalCount: items.length,
    items,
  };
}

function toSearchText(item: ForestPlantStory): string[] {
  return [
    item.name,
    item.englishName,
    item.scientificName,
    item.className,
    item.habitat,
    item.guide,
    item.story,
  ].filter((value): value is string => Boolean(value));
}

function getSearchScore(item: ForestPlantStory, keyword: string): number {
  const name = item.name.toLocaleLowerCase("ko-KR");
  const scientificName = item.scientificName?.toLocaleLowerCase("ko-KR") ?? "";

  if (name === keyword || scientificName === keyword) return 0;
  if (name.startsWith(keyword) || scientificName.startsWith(keyword)) return 1;
  if (name.includes(keyword) || scientificName.includes(keyword)) return 2;
  return 3;
}

export function filterForestPlantList(
  list: ForestPlantStoryList,
  searchWrd: string | number | undefined,
  pageNo: string | number | undefined,
  numOfRows: string | number | undefined,
): ForestPlantStoryList {
  const keyword = `${searchWrd ?? ""}`.trim().toLocaleLowerCase("ko-KR");
  const requestedPage = toPositiveInteger(pageNo, 1);
  const requestedRows = toPositiveInteger(numOfRows, 10);
  const source = keyword
    ? list.items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          toSearchText(item).some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword)),
        )
        .sort(
          (a, b) =>
            getSearchScore(a.item, keyword) - getSearchScore(b.item, keyword) ||
            a.index - b.index,
        )
        .map(({ item }) => item)
    : list.items;

  const start = (requestedPage - 1) * requestedRows;
  return {
    ...list,
    pageNo: requestedPage,
    numOfRows: requestedRows,
    totalCount: source.length,
    items: source.slice(start, start + requestedRows),
  };
}

export function getFallbackForestPlants({
  pageNo = 1,
  numOfRows = 10,
}: {
  searchWrd?: string | number;
  pageNo?: string | number;
  numOfRows?: string | number;
} = {}): ForestPlantStoryList {
  return {
    resultCode: "CSV_UNAVAILABLE",
    resultMsg: "정제 CSV 식물 데이터를 읽을 수 없습니다.",
    pageNo: toPositiveInteger(pageNo, 1),
    numOfRows: toPositiveInteger(numOfRows, 10),
    totalCount: 0,
    items: [],
  };
}

export function getFallbackForestPlantImages({
  pageNo = 1,
  numOfRows = 10,
}: {
  pageNo?: string | number;
  numOfRows?: string | number;
} = {}): ForestPlantImageList {
  return {
    resultCode: "NO_IMAGE_FIELDS",
    resultMsg: "정제 CSV 식물 데이터에는 이미지 필드가 없습니다.",
    pageNo: toPositiveInteger(pageNo, 1),
    numOfRows: toPositiveInteger(numOfRows, 10),
    totalCount: 0,
    items: [],
  };
}

export async function fetchForestPlantImages({
  pageNo = 1,
  numOfRows = 10,
}: ForestPlantsQuery = {}): Promise<ForestPlantImageList> {
  return getFallbackForestPlantImages({ pageNo, numOfRows });
}

function looksDanglingKoreanPhrase(text: string): boolean {
  return /(?:하며|하여|하고|이며|이고|거나|또는|및|하|,|，|:|：)$/.test(text.trim());
}

function toCompleteSummary(text: string | undefined, maxSentences = 2): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;

  const protectedText = trimmed.replace(/(\d)\.(\d)/g, "$1<DECIMAL_POINT>$2");
  const sentences = protectedText.match(/[^.!?。！？]+[.!?。！？]/g);
  if (sentences?.length) {
    return sentences
      .slice(0, maxSentences)
      .map((sentence) => sentence.replaceAll("<DECIMAL_POINT>", ".").trim())
      .join(" ");
  }

  return looksDanglingKoreanPhrase(trimmed) ? undefined : trimmed;
}

function choosePlantDescription(item: ForestPlantStory): string {
  return (
    toCompleteSummary(item.story) ??
    toCompleteSummary(item.lifetime) ??
    toCompleteSummary(item.guide, 1) ??
    ""
  );
}

export function toPlantInfoList(list: ForestPlantStoryList): PlantInfo[] {
  return list.items.map((item) => ({
    id: `forest-plant-${item.id}`,
    name: item.name,
    scientificName: item.scientificName ?? "",
    description: choosePlantDescription(item),
    usage: item.guide,
    habitat: item.habitat,
    floweringSeason: item.lifetime,
  }));
}
