/**
 * @deprecated 이 모듈은 로컬 CSV 파일에서 식물 데이터를 읽는 레거시 코드입니다.
 * Supabase forest_plants 테이블 조회로 대체되었습니다.
 * → forest-plants-supabase.server.ts 사용
 */

import {
  filterForestPlantList,
  normalizeForestPlantsCsv,
} from "./forest-plants";
import type { ForestPlantStoryList } from "@/types";

const FOREST_PLANTS_CSV_PATH =
  "api가이드파일/산림청_숲에 사는 식물 정보_20240826_정제.csv";

type FetchForestPlantsOptions = {
  searchWrd?: string | number;
  pageNo?: string | number;
  numOfRows?: string | number;
  csvPath?: string;
};

const forestPlantListCache = new Map<string, Promise<ForestPlantStoryList>>();

async function loadForestPlantsFromCsv(
  csvPath = FOREST_PLANTS_CSV_PATH,
): Promise<ForestPlantStoryList> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const absolutePath = path.isAbsolute(csvPath) ? csvPath : path.resolve(csvPath);

  let cached = forestPlantListCache.get(absolutePath);
  if (!cached) {
    cached = readFile(absolutePath, "utf8").then(normalizeForestPlantsCsv);
    forestPlantListCache.set(absolutePath, cached);
  }

  return cached;
}

export async function fetchForestPlants({
  searchWrd,
  pageNo = 1,
  numOfRows = 10,
  csvPath,
}: FetchForestPlantsOptions = {}): Promise<ForestPlantStoryList> {
  const list = await loadForestPlantsFromCsv(csvPath);
  return filterForestPlantList(list, searchWrd, pageNo, numOfRows);
}
