import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR_NAME = "api가이드파일";
const SOURCE_FILE_SUFFIX = "_20240826.csv";
const CLEAN_LABEL = "정제";
const REPORT_LABEL = "리포트";
const DEFAULT_MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 45;
const MAX_CONCURRENT_BATCHES = 3;

const INDEX = {
  storyNo: 0,
  plantName: 2,
  story: 9,
};

function parseEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

async function loadLocalEnv() {
  try {
    return parseEnv(await fs.readFile(path.resolve(".env"), "utf8"));
  } catch {
    return {};
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
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

function stringifyCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = `${value ?? ""}`;
          if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
          return text;
        })
        .join(","),
    )
    .join("\r\n");
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit);
    const batchResults = await Promise.all(batch.map((item, batchIndex) => mapper(item, index + batchIndex)));
    results.push(...batchResults);
  }

  return results;
}

function normalizeStoryFragment(value) {
  return `${value ?? ""}`
    .replaceAll("&#160;", " ")
    .replace(/&#\d*$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function alreadyCompleteSentence(value) {
  const text = normalizeStoryFragment(value);
  return /[.!?。！？]$/u.test(text);
}

function extractJsonArray(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1]);

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
  }

  throw new Error("Gemini response did not contain a JSON array.");
}

function buildPrompt(records) {
  return `
다음 데이터는 산림청 숲 식물 CSV의 '식물이야기설명' 컬럼 원문 조각입니다.
대부분 마지막 문장이 중간에서 끊겨 있습니다.

작업:
- 각 storyFragment를 자연스러운 한국어 완성 문장 1개로 정리하십시오.
- 이 작업은 공식 원문 복원이 아니라 끊긴 문장을 읽히게 다듬는 작업입니다.
- 원문 조각의 주어, 핵심 표현, 의미를 최대한 유지하십시오.
- 문장이 끊긴 부분은 중립적인 종결 표현으로 마무리하십시오.
- 식물의 생태, 효능, 서식지 같은 새 사실을 추가하지 마십시오.
- 원문에 없는 목록, 학명, 효능, 서식지, 꽃/열매 특징, 구체 사례를 새로 넣지 마십시오.
- 다른 컬럼 설명이나 식물의일생 내용으로 대체하지 마십시오.
- 원문 오탈자는 문장 마무리에 꼭 필요한 경우가 아니면 고치지 마십시오.
- 모든 cleanedStory는 마침표로 끝내십시오.
- 판단이 어려우면 설명을 확장하지 말고 "라는 이야기가 있다.", "라고 한다.", "등으로 불린다." 같은 중립 종결만 쓰십시오.
- cleanedStory는 가능하면 100자 이하로 작성하십시오.

반환 형식:
JSON 배열만 반환하십시오. 설명 문장, 마크다운, 코드블록은 금지합니다.
각 원소는 {"id":"원본 id","cleanedStory":"정제 문장"} 형식이어야 합니다.

입력:
${JSON.stringify(records, null, 2)}
`.trim();
}

async function requestGeminiCompletion({ apiKey, model, records }) {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(records) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  return extractJsonArray(text);
}

async function findInputPath() {
  const dataDir = path.resolve(DATA_DIR_NAME);
  const entries = await fs.readdir(dataDir);
  const sourceFile = entries.find(
    (entry) => entry.endsWith(SOURCE_FILE_SUFFIX) && !entry.includes(`_${CLEAN_LABEL}`),
  );
  if (!sourceFile) {
    throw new Error(`Source CSV ending with ${SOURCE_FILE_SUFFIX} was not found in ${dataDir}.`);
  }
  return path.join(dataDir, sourceFile);
}

function buildOutputPaths(inputPath) {
  const parsed = path.parse(inputPath);
  return {
    outputPath: path.join(parsed.dir, `${parsed.name}_${CLEAN_LABEL}${parsed.ext}`),
    reportPath: path.join(parsed.dir, `${parsed.name}_${CLEAN_LABEL}_${REPORT_LABEL}.json`),
  };
}

function validateRows(headers, rows) {
  if (headers.length <= INDEX.story) {
    throw new Error("CSV does not have the expected story column position.");
  }

  const invalidRow = rows.find((row) => row.length !== headers.length);
  if (invalidRow) {
    throw new Error(`CSV row has ${invalidRow.length} columns, expected ${headers.length}.`);
  }
}

function validateOnlyStoryChanged(originalRows, cleanedRows) {
  const changedOutsideStory = [];

  for (let rowIndex = 1; rowIndex < originalRows.length; rowIndex += 1) {
    const originalRow = originalRows[rowIndex];
    const cleanedRow = cleanedRows[rowIndex];

    for (let colIndex = 0; colIndex < originalRow.length; colIndex += 1) {
      if (colIndex === INDEX.story) continue;
      if ((originalRow[colIndex] ?? "") !== (cleanedRow[colIndex] ?? "")) {
        changedOutsideStory.push({
          row: rowIndex + 1,
          column: colIndex + 1,
          original: originalRow[colIndex] ?? "",
          cleaned: cleanedRow[colIndex] ?? "",
        });
      }
    }
  }

  return changedOutsideStory;
}

function sanitizeGeminiResult(value) {
  return normalizeStoryFragment(value).replace(/[。！？]$/u, (match) => {
    if (match === "。") return ".";
    if (match === "！") return "!";
    return "?";
  });
}

function isValidCleanedStory(value) {
  return normalizeStoryFragment(value).length > 0 && /[.!?]$/u.test(normalizeStoryFragment(value));
}

const localEnv = await loadLocalEnv();
const apiKey =
  process.env.GEMINI_API_KEY ??
  process.env.VITE_GEMINI_API_KEY ??
  process.env.GOOGLE_GEMINI_API_KEY ??
  process.env.VITE_GOOGLE_GEMINI_API_KEY ??
  localEnv.GEMINI_API_KEY ??
  localEnv.VITE_GEMINI_API_KEY ??
  localEnv.GOOGLE_GEMINI_API_KEY ??
  localEnv.VITE_GOOGLE_GEMINI_API_KEY;
const model =
  process.env.GEMINI_CSV_CLEANUP_MODEL ?? localEnv.GEMINI_CSV_CLEANUP_MODEL ?? DEFAULT_MODEL;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required because story endings must be completed without copying another column.");
}

const inputPath = await findInputPath();
const { outputPath, reportPath } = buildOutputPaths(inputPath);
const source = await fs.readFile(inputPath);
const text = new TextDecoder("windows-949").decode(source);
const originalRows = parseCsv(text).filter((row) => row.some((value) => value.trim() !== ""));
const headers = originalRows[0];
const dataRows = originalRows.slice(1);
validateRows(headers, dataRows);

const recordsToClean = dataRows.map((row, index) => ({
  id: `${index + 1}`,
  storyNo: row[INDEX.storyNo],
  plantName: row[INDEX.plantName],
  storyFragment: normalizeStoryFragment(row[INDEX.story]),
  alreadyComplete: alreadyCompleteSentence(row[INDEX.story]),
}));

const cleanedById = new Map();
const completionBatches = chunk(recordsToClean, BATCH_SIZE);
const batchResults = await mapWithConcurrency(completionBatches, MAX_CONCURRENT_BATCHES, async (batch, index) => {
  console.log(`Cleaning story batch ${index + 1}/${completionBatches.length}`);
  return requestGeminiCompletion({
    apiKey,
    model,
    records: batch.map(({ id, plantName, storyFragment }) => ({ id, plantName, storyFragment })),
  });
});

for (const result of batchResults) {
  for (const item of result) {
    if (!item || typeof item.id !== "string" || typeof item.cleanedStory !== "string") {
      throw new Error(`Invalid Gemini result item: ${JSON.stringify(item)}`);
    }
    cleanedById.set(item.id, sanitizeGeminiResult(item.cleanedStory));
  }
}

const cleanedRows = [headers, ...dataRows.map((row) => [...row])];
const changes = [];
const invalidStories = [];

for (const record of recordsToClean) {
  const cleanedStory = cleanedById.get(record.id);
  if (!cleanedStory) {
    invalidStories.push({
      rowId: record.id,
      storyNo: record.storyNo,
      plantName: record.plantName,
      reason: "missing Gemini result",
    });
    continue;
  }

  if (!isValidCleanedStory(cleanedStory)) {
    invalidStories.push({
      rowId: record.id,
      storyNo: record.storyNo,
      plantName: record.plantName,
      originalStory: record.storyFragment,
      cleanedStory,
      reason: "cleaned story is empty or does not end with punctuation",
    });
    continue;
  }

  const rowIndex = Number(record.id);
  cleanedRows[rowIndex][INDEX.story] = cleanedStory;

  if (record.storyFragment !== cleanedStory) {
    changes.push({
      rowId: record.id,
      storyNo: record.storyNo,
      plantName: record.plantName,
      originalStory: record.storyFragment,
      cleanedStory,
      alreadyComplete: record.alreadyComplete,
    });
  }
}

const changedOutsideStory = validateOnlyStoryChanged(originalRows, cleanedRows);
if (changedOutsideStory.length > 0) {
  throw new Error(`Columns outside story changed: ${JSON.stringify(changedOutsideStory.slice(0, 5))}`);
}

if (invalidStories.length > 0) {
  throw new Error(`Story cleanup failed: ${JSON.stringify(invalidStories.slice(0, 5))}`);
}

const report = {
  input: inputPath,
  output: outputPath,
  model,
  totalRows: dataRows.length,
  changedStoryRows: changes.length,
  unchangedStoryRows: dataRows.length - changes.length,
  changedOutsideStoryRows: changedOutsideStory.length,
  method:
    "Only the story column was completed with minimal Gemini sentence-ending cleanup. Other parsed CSV values are unchanged.",
  warning: "The completed endings are AI-assisted sentence cleanup, not newly verified official Forest Service text.",
  changes,
};

await fs.writeFile(outputPath, `\uFEFF${stringifyCsv(cleanedRows)}\r\n`, "utf8");
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      reportPath,
      model,
      totalRows: report.totalRows,
      changedStoryRows: report.changedStoryRows,
      unchangedStoryRows: report.unchangedStoryRows,
      changedOutsideStoryRows: report.changedOutsideStoryRows,
    },
    null,
    2,
  ),
);
