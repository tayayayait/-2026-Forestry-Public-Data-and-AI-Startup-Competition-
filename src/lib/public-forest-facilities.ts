import type {
  FacilityDetailSection,
  FacilityInfo,
  ForestEducationProgram,
  ForestEducationProgramList,
  GeocodingResult,
  RecreationForest,
  RecreationForestList,
  TraditionalVillageForest,
  TraditionalVillageForestList,
} from "@/types";

const DEFAULT_ACCESSIBILITY = {
  wheelchair: false,
  stroller: false,
  parking: true,
  restroom: true,
  elevator: false,
  helpdog: false,
};

function normalizeKey(value: string | undefined): string {
  return (value ?? "")
    .replace(/^국립\s*/, "")
    .replace(/\s+/g, "")
    .replace(/[()·ㆍ._-]/g, "")
    .toLowerCase();
}

const GENERIC_FACILITY_KEYS = new Set(["치유의숲", "자연휴양림", "수목원"]);

function isSpecificFacilityKey(value: string): boolean {
  return value.length >= 3 && !GENERIC_FACILITY_KEYS.has(value);
}

function areFacilityNamesCompatible(programFacilityName: string, facilityName: string): boolean {
  if (!programFacilityName || !facilityName) return true;
  if (!isSpecificFacilityKey(programFacilityName) || !isSpecificFacilityKey(facilityName)) {
    return true;
  }

  return (
    programFacilityName === facilityName ||
    programFacilityName.includes(facilityName) ||
    facilityName.includes(programFacilityName)
  );
}

function normalizeIdKey(value: string | undefined): string {
  return (value ?? "")
    .replace(/\s+/g, "")
    .replace(/[()·ㆍ._-]/g, "")
    .toLowerCase();
}

function unique(values: Array<string | undefined>): string[] {
  return [
    ...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value)),
  ];
}

function splitLabels(value: string | undefined): string[] {
  return value ? unique(value.split(/[,/|]/g)) : [];
}

function detailSection(
  title: string,
  items: Array<{ label: string; value: string | number | boolean | null | undefined }>,
): FacilityDetailSection | null {
  const filteredItems = items
    .map(({ label, value }) => ({ label, value: `${value ?? ""}`.trim() }))
    .filter((item) => item.value);

  return filteredItems.length > 0 ? { title, items: filteredItems } : null;
}

function formatBoolean(value: boolean | null | undefined): string | undefined {
  if (value == null) return undefined;
  return value ? "가능" : "불가";
}

function formatAreaSquareMeters(value: string | undefined): string | undefined {
  const area = value?.trim();
  if (!area) return undefined;

  const formattedArea = area.replace(/[\d,]+(?:\.\d+)?/g, (match) => {
    const num = Number(match.replace(/,/g, ""));
    if (isNaN(num)) return match;
    return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 10 }).format(num);
  });

  return /(?:㎡|m2|m²|제곱미터)$/i.test(formattedArea) ? formattedArea : `${formattedArea}㎡`;
}

function hasCoordinates(forest: RecreationForest): forest is RecreationForest & {
  name: string;
  latitude: number;
  longitude: number;
} {
  return Number.isFinite(forest.latitude) && Number.isFinite(forest.longitude) && !!forest.name;
}

function buildFacilityIntro(forest: RecreationForest): string {
  return unique([
    forest.type ? `휴양림구분: ${forest.type}` : undefined,
    forest.institutionName ? `관리기관: ${forest.institutionName}` : undefined,
    forest.stayingAvailable == null
      ? undefined
      : `숙박가능: ${forest.stayingAvailable ? "가능" : "불가능"}`,
  ]).join(" · ");
}

function recreationForestBaseId(forest: RecreationForest): string {
  return `recreation-forest-${normalizeIdKey(forest.name) || normalizeIdKey(forest.roadAddress)}`;
}

function traditionalVillageForestId(forest: TraditionalVillageForest): string {
  return `traditional-village-forest-${
    normalizeIdKey(forest.name) || normalizeIdKey(forest.address)
  }`;
}

export function mapRecreationForestsToFacilities(list: RecreationForestList): FacilityInfo[] {
  const seenIds = new Map<string, number>();

  return list.items.filter(hasCoordinates).map((forest) => {
    const baseId = recreationForestBaseId(forest);
    const seenCount = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, seenCount + 1);
    const id =
      seenCount === 0 ? baseId : `${baseId}-${normalizeIdKey(forest.roadAddress) || seenCount + 1}`;
    const detailSections = [
      detailSection("운영 정보", [
        { label: "휴양림 구분", value: forest.type },
        { label: "관리기관", value: forest.institutionName },
        { label: "숙박가능 여부", value: formatBoolean(forest.stayingAvailable) },
        {
          label: "입장료",
          value: forest.admissionFee
            ?.split("+")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", "),
        },
        { label: "전화번호", value: forest.telephoneNumber },
        { label: "홈페이지", value: forest.homepageUrl },
      ]),
      detailSection("시설 정보", [
        {
          label: "주요시설",
          value: forest.mainFacilities
            ?.split("+")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", "),
        },
        { label: "수용인원", value: forest.capacity == null ? undefined : `${forest.capacity}명` },
        { label: "휴양림 면적", value: formatAreaSquareMeters(forest.area) },
        { label: "도로명주소", value: forest.roadAddress },
      ]),
      detailSection("공공데이터 출력값", [
        { label: "휴양림명", value: forest.name },
        { label: "시도명", value: forest.provinceName },
        { label: "위도", value: forest.latitude },
        { label: "경도", value: forest.longitude },
        { label: "데이터 기준일", value: forest.referenceDate },
        { label: "제공기관 코드", value: forest.providerCode },
      ]),
    ].filter((section): section is FacilityDetailSection => section != null);

    return {
      id,
      name: forest.name,
      type: "recreation_forest",
      address: forest.roadAddress ?? "",
      lat: forest.latitude,
      lng: forest.longitude,
      tel: forest.telephoneNumber,
      homepage: forest.homepageUrl,
      intro: buildFacilityIntro(forest),
      maxCapacity: forest.capacity ?? undefined,
      programs: unique(["자연휴양림", ...splitLabels(forest.mainFacilities)]),
      trails: [],
      educationPrograms: [],
      accessibility: { ...DEFAULT_ACCESSIBILITY },
      detailSections,
    };
  });
}

export function mapTraditionalVillageForestsToFacilities(
  list: TraditionalVillageForestList,
  geocodesByAddress: Map<string, GeocodingResult>,
): FacilityInfo[] {
  return list.items.flatMap((forest) => {
    const address = forest.address?.trim();
    if (!forest.name || !address) return [];

    const geocode = geocodesByAddress.get(address);
    if (!geocode) return [];

    return [
      {
        id: traditionalVillageForestId(forest),
        name: forest.name,
        type: "traditional_village_forest",
        address,
        lat: geocode.lat,
        lng: geocode.lng,
        intro: unique([
          forest.mainTreeSpecies ? `주요수종: ${forest.mainTreeSpecies}` : undefined,
          forest.mainForestType ? `주요임상: ${forest.mainForestType}` : undefined,
          forest.zoneAreaSquareMeters == null
            ? undefined
            : `구역면적: ${formatAreaSquareMeters(String(forest.zoneAreaSquareMeters))}`,
        ]).join(" · "),
        programs: unique(["전통마을숲", forest.mainTreeSpecies, forest.mainForestType]),
        trails: [],
        educationPrograms: [],
        accessibility: {
          wheelchair: false,
          stroller: false,
          parking: false,
          restroom: false,
          elevator: false,
          helpdog: false,
        },
      } satisfies FacilityInfo,
    ];
  });
}

function matchesFacility(program: ForestEducationProgram, facility: FacilityInfo): boolean {
  const programFacilityName = normalizeKey(program.facilityName);
  const programTitle = normalizeKey(program.title);
  const programContent = normalizeKey(program.content);
  const programAddress = normalizeKey(program.address);
  const facilityName = normalizeKey(facility.name);
  const facilityAddress = normalizeKey(facility.address);
  const hasSpecificProgramFacilityName = isSpecificFacilityKey(programFacilityName);
  const hasSpecificFacilityName = isSpecificFacilityKey(facilityName);
  const hasAddressMatch =
    !!programAddress &&
    !!facilityAddress &&
    (programAddress === facilityAddress ||
      programAddress.includes(facilityAddress) ||
      facilityAddress.includes(programAddress));

  return (
    (!!programFacilityName &&
      !!facilityName &&
      (programFacilityName === facilityName ||
        (hasSpecificFacilityName && programFacilityName.includes(facilityName)) ||
        (hasSpecificProgramFacilityName && facilityName.includes(programFacilityName)))) ||
    (!!programTitle &&
      !!facilityName &&
      hasSpecificFacilityName &&
      programTitle.includes(facilityName)) ||
    (!!programContent &&
      !!facilityName &&
      hasSpecificFacilityName &&
      programContent.includes(facilityName)) ||
    (hasAddressMatch && areFacilityNamesCompatible(programFacilityName, facilityName))
  );
}

function mergeIntro(
  intro: string | undefined,
  programs: ForestEducationProgram[],
): string | undefined {
  const periodNotes = unique(
    programs.map((program) => (program.period ? `운영기간: ${program.period}` : undefined)),
  );
  const managementNotes = unique(
    programs.map((program) =>
      program.managementAgency ? `교육관리기관: ${program.managementAgency}` : undefined,
    ),
  );
  const merged = unique([intro, ...periodNotes, ...managementNotes]).join(" · ");
  return merged || undefined;
}

function educationLabels(programs: ForestEducationProgram[]): string[] {
  return unique(programs.flatMap((program) => [program.title, ...splitLabels(program.category)]));
}

function educationProgramKey(program: ForestEducationProgram): string {
  return normalizeKey(
    [
      program.title,
      program.facilityName,
      program.address,
      program.category,
      program.period,
      program.content,
    ]
      .filter(Boolean)
      .join("|"),
  );
}

function dedupeEducationPrograms(programs: ForestEducationProgram[]): ForestEducationProgram[] {
  const seen = new Set<string>();

  return programs.filter((program) => {
    const key = educationProgramKey(program);
    if (!key) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function mergeForestEducationProgramsIntoFacilities(
  facilities: FacilityInfo[],
  list: ForestEducationProgramList,
): FacilityInfo[] {
  return facilities.map((facility) => {
    const matchedPrograms = list.items.filter((program) => matchesFacility(program, facility));
    if (matchedPrograms.length === 0) return facility;
    const educationPrograms = dedupeEducationPrograms([
      ...(facility.educationPrograms ?? []),
      ...matchedPrograms,
    ]);

    return {
      ...facility,
      intro: mergeIntro(facility.intro, educationPrograms),
      programs: unique([...facility.programs, ...educationLabels(educationPrograms)]),
      educationPrograms,
    };
  });
}
