const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const ROOT = process.cwd();
const API_DIR = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .find((entry) => entry.isDirectory() && entry.name.startsWith("api"))?.name;

if (!API_DIR) {
  throw new Error("Could not find the API guide data directory.");
}

const OUTPUT_PATH = path.join(ROOT, "src", "lib", "static-forest-location-facilities.ts");
const cp949Decoder = new TextDecoder("euc-kr");

const ACCESSIBILITY = {
  wheelchair: false,
  stroller: false,
  parking: false,
  restroom: false,
  elevator: false,
  helpdog: false,
};

const GRS80 = {
  a: 6378137,
  inverseFlattening: 298.257222101,
};

const PROJECTIONS = {
  forestRecreationArboretum: {
    ...GRS80,
    lat0: 38,
    lon0: 127.5,
    k0: 0.9996,
    falseEasting: 1000000,
    falseNorthing: 2000000,
  },
};

function meridionalArc(phi, e2, a) {
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  return (
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi))
  );
}

function inverseTransverseMercator(x, y, projection) {
  const f = 1 / projection.inverseFlattening;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const a = projection.a;
  const lat0 = toRadians(projection.lat0);
  const lon0 = toRadians(projection.lon0);
  const m0 = meridionalArc(lat0, e2, a);
  const m = m0 + (y - projection.falseNorthing) / projection.k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const n1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
  const t1 = tanPhi1 * tanPhi1;
  const c1 = ep2 * cosPhi1 * cosPhi1;
  const r1 = (a * (1 - e2)) / (1 - e2 * sinPhi1 * sinPhi1) ** 1.5;
  const d = (x - projection.falseEasting) / (n1 * projection.k0);

  const lat =
    phi1 -
    ((n1 * tanPhi1) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) * d ** 6) / 720);

  const lon =
    lon0 +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) * d ** 5) / 120) /
      cosPhi1;

  return {
    lat: roundCoordinate(toDegrees(lat)),
    lng: roundCoordinate(toDegrees(lon)),
  };
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function roundCoordinate(value) {
  return Number(value.toFixed(6));
}

function readDbf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];

  for (let offset = 32; offset < headerLength && buffer[offset] !== 0x0d; offset += 32) {
    const name = buffer
      .subarray(offset, offset + 11)
      .toString("ascii")
      .replace(/\0.*$/, "")
      .trim();
    fields.push({
      name,
      type: String.fromCharCode(buffer[offset + 11]),
      length: buffer[offset + 16],
    });
  }

  const records = [];
  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = headerLength + index * recordLength;
    if (buffer[recordOffset] === 0x2a) continue;

    let fieldOffset = recordOffset + 1;
    const record = {};
    for (const field of fields) {
      const rawValue = buffer.subarray(fieldOffset, fieldOffset + field.length);
      fieldOffset += field.length;
      const text = cp949Decoder.decode(rawValue).trim();
      record[field.name] = field.type === "N" ? toNumber(text) : text;
    }
    records.push(record);
  }

  return records;
}

function toNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPointShapes(filePath) {
  const buffer = fs.readFileSync(filePath);
  const points = [];
  let offset = 100;

  while (offset < buffer.length) {
    const contentLengthBytes = buffer.readInt32BE(offset + 4) * 2;
    const contentOffset = offset + 8;
    const shapeType = buffer.readInt32LE(contentOffset);
    if (shapeType === 1) {
      points.push({
        x: buffer.readDoubleLE(contentOffset + 4),
        y: buffer.readDoubleLE(contentOffset + 12),
      });
    } else {
      points.push(null);
    }
    offset = contentOffset + contentLengthBytes;
  }

  return points;
}

function compactLabels(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}

function detailSection(title, items) {
  const filteredItems = items
    .map(({ label, value }) => ({ label, value: `${value ?? ""}`.trim() }))
    .filter((item) => item.value);

  return filteredItems.length > 0 ? { title, items: filteredItems } : null;
}

function convertArboretums() {
  const base = path.join(ROOT, API_DIR, "TB_FGDI_FS_HS", "TB_FGDI_FS_HS");
  const records = readDbf(`${base}.dbf`);
  const points = readPointShapes(`${base}.shp`);

  return records.flatMap((record, index) => {
    if (record.RCAR_SCTIN !== "수목원") return [];
    const point = points[index];
    if (!point) throw new Error(`Missing arboretum point at ${index}`);
    const { lat, lng } = inverseTransverseMercator(
      point.x,
      point.y,
      PROJECTIONS.forestRecreationArboretum,
    );
    const sourceId = Math.trunc(record.OBJ_ID ?? index + 1);
    const detailSections = [
      detailSection("운영 정보", [
        { label: "운영주체", value: record.OWNER_NM },
        { label: "시설구분", value: record.RCAR_SCTIN },
        { label: "전화번호", value: record.TEL_NO },
        { label: "홈페이지", value: record.SITE_URL },
      ]),
      detailSection("위치도 출력값", [
        { label: "수목원명", value: record.RCAR_NM },
        { label: "주소", value: record.DTADD },
        { label: "읍면동 코드", value: record.EMNDN_CD },
        { label: "읍면동명", value: record.EMNDN_NM },
        { label: "원천 객체 ID", value: record.OBJ_ID },
      ]),
    ].filter(Boolean);
    return [
      {
        id: `arboretum-${sourceId}`,
        name: record.RCAR_NM || "수목원",
        type: "arboretum",
        address: record.DTADD || "",
        lat,
        lng,
        tel: record.TEL_NO || undefined,
        homepage: record.SITE_URL || undefined,
        intro: compactLabels([
          record.OWNER_NM ? `운영주체: ${record.OWNER_NM}` : "",
          record.RCAR_SCTIN ? `시설구분: ${record.RCAR_SCTIN}` : "",
        ]).join(" · "),
        programs: compactLabels(["수목원", record.OWNER_NM]),
        trails: [],
        accessibility: ACCESSIBILITY,
        detailSections,
      },
    ];
  });
}

function serializeExport(name, value) {
  return `export const ${name} = ${JSON.stringify(value, null, 2)} satisfies FacilityInfo[];\n`;
}

const arboretums = convertArboretums();

const output = `import type { FacilityInfo } from "@/types";

// Generated by scripts/convert-forest-location-shapes.cjs from Forest Service SHP files.
// Source folders:
// - api가이드파일/TB_FGDI_FS_HS

${serializeExport("STATIC_ARBORETUM_FACILITIES", arboretums)}
`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");
console.log(
  JSON.stringify({
    output: path.relative(ROOT, OUTPUT_PATH),
    arboretums: arboretums.length,
  }),
);
