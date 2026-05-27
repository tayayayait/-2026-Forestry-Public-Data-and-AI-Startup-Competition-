import type { FacilityInfo } from "@/types";

type FacilityImageSearchTarget = Pick<FacilityInfo, "name" | "address" | "type">;

const LOCALITY_PATTERN = /^[가-힣]+(?:시|군|구)$/;
const UPPER_LEVEL_CITY_PATTERN = /(?:특별시|광역시|특별자치시)$/;
const LOCALITY_SUFFIX_PATTERN = /(?:특별시|광역시|특별자치시|시|군|구)$/;

function cleanText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeComparisonText(value: string): string {
  return cleanText(value).replace(/\s+/g, "").toLowerCase();
}

function hasKidsForestKeyword(value: string): boolean {
  return normalizeComparisonText(value).includes("유아숲체험");
}

function buildPrimaryKidsForestQuery(facilityName: string): string {
  const name = cleanText(facilityName);
  if (!name) return "유아숲체험원";
  return hasKidsForestKeyword(name) ? name : `${name} 유아숲체험원`;
}

function shortLocalityName(locality: string): string {
  return cleanText(locality).replace(LOCALITY_SUFFIX_PATTERN, "");
}

function extractAddressLocalities(address: string): string[] {
  const candidates = cleanText(address)
    .split(" ")
    .map((token) => token.replace(/[(),]/g, ""))
    .filter((token) => LOCALITY_PATTERN.test(token));
  const hasLowerLevelLocality = candidates.some((token) => !UPPER_LEVEL_CITY_PATTERN.test(token));

  return candidates.filter((token) => {
    if (!UPPER_LEVEL_CITY_PATTERN.test(token)) return true;
    return !hasLowerLevelLocality;
  });
}

function removeLeadingLocality(name: string, localities: string[]): string {
  let result = cleanText(name);

  for (const locality of localities) {
    const shortName = shortLocalityName(locality);
    for (const prefix of [locality, shortName]) {
      if (!prefix) continue;
      if (result === prefix) return result;
      if (result.startsWith(`${prefix} `)) {
        result = result.slice(prefix.length).trim();
      }
    }
  }

  return result || name;
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries.flatMap((query) => {
    const cleaned = cleanText(query);
    const key = normalizeComparisonText(cleaned);
    if (!cleaned || seen.has(key)) return [];
    seen.add(key);
    return [cleaned];
  });
}

export function buildKidsForestImageSearchQueries(
  facility: Pick<FacilityInfo, "name" | "address">,
): string[] {
  const primaryQuery = buildPrimaryKidsForestQuery(facility.name);
  const localities = extractAddressLocalities(facility.address);
  const localName = removeLeadingLocality(primaryQuery, localities);
  const localityQueries = localities.map((locality) => `${locality} ${localName}`);

  return uniqueQueries([primaryQuery, ...localityQueries]);
}

export function buildFacilityImageSearchQueries(facility: FacilityImageSearchTarget): string[] {
  if (facility.type === "kids_forest") {
    return buildKidsForestImageSearchQueries(facility);
  }

  return uniqueQueries([facility.name]);
}
