/**
 * Supabase에서 forest_plants 테이블을 조회하는 서버 전용 모듈.
 * 기존 forest-plants-csv.server.ts (로컬 CSV 읽기)를 대체합니다.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ForestPlantStory, ForestPlantStoryList } from "@/types";

type FetchForestPlantsOptions = {
  searchWrd?: string | number;
  pageNo?: string | number;
  numOfRows?: string | number;
};

function toPositiveInteger(
  value: string | number | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function fetchForestPlantsFromSupabase({
  searchWrd,
  pageNo = 1,
  numOfRows = 10,
}: FetchForestPlantsOptions = {}): Promise<ForestPlantStoryList> {
  const requestedPage = toPositiveInteger(pageNo, 1);
  const requestedRows = toPositiveInteger(numOfRows, 10);
  const offset = (requestedPage - 1) * requestedRows;

  const keyword = `${searchWrd ?? ""}`.trim();

  // 검색어가 있으면 식물명/학명/안내/서식장소 등에서 ilike 검색
  let query = supabaseAdmin.from("forest_plants").select("*", { count: "exact" });

  if (keyword) {
    const pattern = `%${keyword}%`;
    query = query.or(
      `name.ilike.${pattern},scientific_name.ilike.${pattern},english_name.ilike.${pattern},guide.ilike.${pattern},habitat.ilike.${pattern},class_name.ilike.${pattern},story.ilike.${pattern}`,
    );
  }

  query = query.order("id", { ascending: true }).range(offset, offset + requestedRows - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Supabase forest_plants 조회 실패: ${error.message}`);
  }

  const items: ForestPlantStory[] = (data ?? []).map((row) => ({
    id: String(row.id),
    category: row.category ?? undefined,
    name: row.name,
    englishName: row.english_name ?? undefined,
    guide: row.guide ?? undefined,
    scientificName: row.scientific_name ?? undefined,
    className: row.class_name ?? undefined,
    habitat: row.habitat ?? undefined,
    lifetime: row.lifetime ?? undefined,
    offer: row.offer ?? undefined,
    registeredAt: row.registered_at ?? undefined,
    story: row.story ?? undefined,
  }));

  return {
    resultCode: "SUPABASE",
    resultMsg: "OK",
    pageNo: requestedPage,
    numOfRows: requestedRows,
    totalCount: count ?? items.length,
    items,
  };
}
