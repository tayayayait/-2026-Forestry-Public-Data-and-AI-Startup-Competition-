import fs from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve("api가이드파일/산림청_숲에 사는 식물 정보_20240826.csv");
const outputPath = path.resolve("api가이드파일/산림청_숲에 사는 식물 정보_20240826_보완.csv");
const reportPath = path.resolve("api가이드파일/산림청_숲에 사는 식물 정보_20240826_보완_리포트.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
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
          if (/[",\r\n]/.test(text)) {
            return `"${text.replaceAll('"', '""')}"`;
          }
          return text;
        })
        .join(","),
    )
    .join("\r\n");
}

function toObjects(rows) {
  const [headers, ...records] = rows;
  return records
    .filter((record) => record.some((value) => value.trim() !== ""))
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header.trim(), record[index]?.trim() ?? ""])),
    );
}

function hasSentenceEnd(text) {
  return /[.!?。！？]$/.test(text.trim());
}

function looksDanglingKoreanPhrase(text) {
  return /(?:하며|하여|하고|이며|이고|거나|또는|및|와|과|로|으로|,|，|:|：)$/.test(text.trim());
}

function splitCompleteSentences(text) {
  const protectedText = text.replace(/(\d)\.(\d)/g, "$1<DECIMAL_POINT>$2");
  return [...protectedText.matchAll(/[^.!?。！？]+[.!?。！？]/g)].map((match) =>
    match[0].replaceAll("<DECIMAL_POINT>", ".").trim(),
  );
}

function completeSummary(text, maxSentences = 2) {
  const trimmed = `${text ?? ""}`.trim();
  if (!trimmed || looksDanglingKoreanPhrase(trimmed)) return "";

  const sentences = splitCompleteSentences(trimmed);
  if (sentences.length > 0) return sentences.slice(0, maxSentences).join(" ");
  return hasSentenceEnd(trimmed) ? trimmed : "";
}

function buildSupplement(row) {
  const story = row["식물이야기설명"] ?? "";
  const lifetime = row["식물의일생"] ?? "";
  const guide = row["안내"] ?? "";

  const storySummary = completeSummary(story, 2);
  if (storySummary) {
    return {
      status: "원문완결",
      source: "식물이야기설명",
      needsRepair: "N",
      summary: storySummary,
      note: "",
    };
  }

  const lifetimeSummary = completeSummary(lifetime, 2);
  if (lifetimeSummary) {
    return {
      status: story.trim() ? "원문미완성추정" : "원문없음",
      source: "식물의일생",
      needsRepair: "Y",
      summary: lifetimeSummary,
      note: "식물이야기설명이 완결 문장으로 끝나지 않아 식물의일생 앞쪽 완결 문장으로 대체",
    };
  }

  return {
    status: story.trim() ? "원문미완성추정" : "원문없음",
    source: guide.trim() ? "안내" : "없음",
    needsRepair: "Y",
    summary: guide.trim(),
    note: guide.trim()
      ? "식물이야기설명과 식물의일생에서 완결 문장을 확보하지 못해 안내문으로 대체"
      : "보완 가능한 설명 원문 없음",
  };
}

const source = await fs.readFile(inputPath);
const text = new TextDecoder("windows-949").decode(source);
const parsed = parseCsv(text);
const headers = parsed[0].map((header) => header.trim());
const records = toObjects(parsed);

const supplementHeaders = ["대표설명_보완", "보완설명출처", "원문이야기상태", "보완필요", "보완사유"];
const outputHeaders = [...headers, ...supplementHeaders];
const outputRows = [outputHeaders];

const report = {
  input: inputPath,
  output: outputPath,
  totalRows: records.length,
  storyComplete: 0,
  storyReplacedFromLifetime: 0,
  storyReplacedFromGuide: 0,
  unrepaired: 0,
  examples: [],
};

for (const row of records) {
  const supplement = buildSupplement(row);
  if (supplement.needsRepair === "N") report.storyComplete += 1;
  if (supplement.source === "식물의일생") report.storyReplacedFromLifetime += 1;
  if (supplement.source === "안내") report.storyReplacedFromGuide += 1;
  if (!supplement.summary) report.unrepaired += 1;

  if (supplement.needsRepair === "Y" && report.examples.length < 12) {
    report.examples.push({
      storyNo: row["숲이야기순번"],
      plantName: row["식물명"],
      originalStory: row["식물이야기설명"],
      repairedSummary: supplement.summary,
      source: supplement.source,
    });
  }

  outputRows.push([
    ...headers.map((header) => row[header] ?? ""),
    supplement.summary,
    supplement.source,
    supplement.status,
    supplement.needsRepair,
    supplement.note,
  ]);
}

await fs.writeFile(outputPath, `\uFEFF${stringifyCsv(outputRows)}\r\n`, "utf8");
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      reportPath,
      totalRows: report.totalRows,
      storyComplete: report.storyComplete,
      storyReplacedFromLifetime: report.storyReplacedFromLifetime,
      storyReplacedFromGuide: report.storyReplacedFromGuide,
      unrepaired: report.unrepaired,
    },
    null,
    2,
  ),
);
