/**
 * CSV → Supabase forest_plants 시드 스크립트
 *
 * 사용법:
 *   npx tsx scripts/seed-forest-plants.ts
 *
 * 환경변수 필요:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env에 설정)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config(); // .env 로드

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_PATH = resolve(
  "api가이드파일/산림청_숲에 사는 식물 정보_20240826_정제.csv",
);

// ── CSV 파서 (forest-plants.ts에서 가져온 로직) ──

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

function normalizeCell(value: string | undefined): string | null {
  const normalized = (value ?? "").replace(/^\uFEFF/u, "").replace(/\s+/gu, " ").trim();
  return normalized || null;
}

type ForestPlantRow = {
  id: number;
  category: string | null;
  name: string;
  english_name: string | null;
  guide: string | null;
  scientific_name: string | null;
  class_name: string | null;
  habitat: string | null;
  lifetime: string | null;
  story: string | null;
  offer: string | null;
  registered_at: string | null;
};

function csvToRows(text: string): ForestPlantRow[] {
  const parsed = parseCsv(text);
  const [headerRow, ...dataRows] = parsed.filter((row) =>
    row.some((v) => v.trim() !== ""),
  );
  if (!headerRow) return [];

  const headers = headerRow.map((h) => h.replace(/^\uFEFF/u, "").trim());

  return dataRows
    .map((row) => {
      const record = Object.fromEntries(
        headers.map((h, i) => [h, normalizeCell(row[i])]),
      ) as Record<string, string | null>;

      const id = Number.parseInt(record["숲이야기순번"] ?? "", 10);
      const name = record["식물명"];
      if (!Number.isFinite(id) || !name) return null;

      // 등록일 포맷 변환 (YYYY-MM-DD)
      let registeredAt = record["등록일"];
      if (registeredAt && !/^\d{4}-\d{2}-\d{2}$/.test(registeredAt)) {
        const dateMatch = registeredAt.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (dateMatch) {
          registeredAt = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
        } else {
          registeredAt = null;
        }
      }

      return {
        id,
        category: record["구분"],
        name,
        english_name: record["영문명"],
        guide: record["안내"],
        scientific_name: record["학명"],
        class_name: record["식물분류군명"],
        habitat: record["서식장소"],
        lifetime: record["식물의일생"],
        story: record["식물이야기설명"],
        offer: record["식물자료제공"],
        registered_at: registeredAt,
      } satisfies ForestPlantRow;
    })
    .filter((row): row is ForestPlantRow => row !== null);
}

// ── 메인 실행 ──

async function main() {
  console.log(`📖 CSV 파일 읽기: ${CSV_PATH}`);
  const csvText = readFileSync(CSV_PATH, "utf8");

  const rows = csvToRows(csvText);
  console.log(`📊 파싱된 식물 데이터: ${rows.length}건`);

  if (rows.length === 0) {
    console.warn("⚠️  파싱된 데이터가 없습니다. CSV 파일을 확인하세요.");
    return;
  }

  // 기존 데이터 삭제 (재실행 대비)
  console.log("🗑️  기존 forest_plants 데이터 삭제...");
  const { error: deleteError } = await supabase
    .from("forest_plants")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    console.error("❌ 삭제 실패:", deleteError.message);
    return;
  }

  // 배치 upsert (500건씩)
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("forest_plants").upsert(batch, {
      onConflict: "id",
    });

    if (error) {
      console.error(`❌ batch ${i}~${i + batch.length} 삽입 실패:`, error.message);
      return;
    }

    inserted += batch.length;
    console.log(`  ✅ ${inserted}/${rows.length} 건 삽입 완료`);
  }

  console.log(`\n🎉 총 ${inserted}건 forest_plants 시드 완료!`);
}

main().catch((err) => {
  console.error("❌ 시드 스크립트 오류:", err);
  process.exit(1);
});
