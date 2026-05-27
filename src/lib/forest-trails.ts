import type { FacilityInfo, ForestTrailCourse, ForestTrailGeometry, TrailInfo } from "@/types";

type LatLng = {
  lat: number;
  lng: number;
};

export type NearbyForestTrailCourse = ForestTrailCourse & {
  distanceFromPointKm: number;
};

const TRAIL_SYSTEMS = {
  "jirisan-dulegil": { name: "지리산둘레길" },
  "geumgang-pine-trail": { name: "금강소나무길" },
  "punchbowl-dulegil": { name: "펀치볼둘레길" },
} as const;

const COURSE_METADATA = [
  ["jirisan-dulegil", "주천 ~ 운봉", "주천면 ~ 가장마을 ~ 운봉읍", 14.7, 360, "moderate"],
  ["jirisan-dulegil", "운봉 ~ 인월", "운봉읍 ~ 비전마을 ~ 인월면", 9.9, 240, "moderate"],
  ["jirisan-dulegil", "인월 ~ 금계", "인월면 ~ 배너미재 ~ 금계마을", 20.5, 480, "hard"],
  ["jirisan-dulegil", "금계 ~ 동강", "금계마을 ~ 송문교 ~ 동강마을", 11, 240, "moderate"],
  ["jirisan-dulegil", "동강 ~ 수철", "동강마을 ~ 상사폭포 ~ 수철마을", 12.1, 300, "moderate"],
  ["jirisan-dulegil", "수철 ~ 성심원", "수철마을 ~ 내리교 ~ 성심원", 12.5, 240, "moderate"],
  ["jirisan-dulegil", "성심원 ~ 운리", "성심원 ~ 점촌마을 ~ 운리마을", 13.4, 300, "moderate"],
  ["jirisan-dulegil", "운리 ~ 덕산", "운리마을 ~ 백운계곡 ~ 덕산", 13.9, 300, "moderate"],
  ["jirisan-dulegil", "덕산 ~ 위태", "덕산 ~ 중태 ~ 위태(상촌)", 9.7, 240, "moderate"],
  ["jirisan-dulegil", "위태 ~ 하동호", "위태(상촌) ~ 궁항마을 ~ 하동호", 11.5, 300, "moderate"],
  ["jirisan-dulegil", "하동호 ~ 삼화실", "위태(상촌) ~ 양이터마을 ~ 하동호", 9.4, 240, "moderate"],
  ["jirisan-dulegil", "삼화실 ~ 대축", "삼화초등학교 ~ 신촌재 ~ 대축마을", 16.7, 420, "hard"],
  ["jirisan-dulegil", "대축 ~ 원부춘", "대축 ~ 원부춘", 8.5, 270, "moderate"],
  ["jirisan-dulegil", "원부춘 ~ 가탄", "원부춘 ~ 가탄", 11.4, 360, "moderate"],
  ["jirisan-dulegil", "가탄 ~ 송정", "가탄마을 ~ 기촌마을 ~ 송정마을", 10.6, 360, "moderate"],
  ["jirisan-dulegil", "송정 ~ 오미", "송정마을 ~ 오미마을", 10.4, 330, "moderate"],
  ["jirisan-dulegil", "오미 ~ 방광", "오미마을 ~ 상사마을 ~ 방광마을", 12.3, 300, "moderate"],
  ["jirisan-dulegil", "오미 ~ 난동", "오미마을 ~ 난동마을", 18.9, 420, "hard"],
  ["jirisan-dulegil", "방광 ~ 산동", "방광마을 ~ 산동면", 13, 330, "moderate"],
  ["jirisan-dulegil", "산동 ~ 주천", "산동 ~ 편백산림욕장 ~ 주천면", 15.9, 420, "hard"],
  ["jirisan-dulegil", "서당 ~ 하동읍", "서당마을 ~ 하동읍", 7, 150, "easy"],
  ["geumgang-pine-trail", "1구간", "두천1리 ~ 샛재 ~ 소광2리", 13.5, 420, "hard"],
  ["geumgang-pine-trail", "2구간", "전곡리 ~ 큰넓재 ~ 소광2리", 11, 240, "moderate"],
  ["geumgang-pine-trail", "3구간", "소광2리 ~ 화전민터 ~ 화전", 16, 420, "hard"],
  ["geumgang-pine-trail", "4구간", "너삼밭 ~ 썩바골 폭포 ~ 대왕송", 9.7, 300, "moderate"],
  ["punchbowl-dulegil", "평화의숲길구간", "와우산 ~ 산채체험장 ~ 잣나무숲", 12.3, 240, "moderate"],
  ["punchbowl-dulegil", "오유밭길", "동막동 ~ 오유저수지 ~ 형제나무", 13.6, 270, "moderate"],
  ["punchbowl-dulegil", "만대벌판길", "와우산 ~ 국립DMZ 자생식물원 ~ 와우산", 17.4, 360, "hard"],
] as const;

let _geometries: ForestTrailGeometry[] | null = null;
let _courses: ForestTrailCourse[] | null = null;

function centerOfBounds(geometry: ForestTrailGeometry): LatLng {
  return {
    lat:
      Math.round(((geometry.bounds.minLat + geometry.bounds.maxLat) / 2) * 1_000_000) / 1_000_000,
    lng:
      Math.round(((geometry.bounds.minLng + geometry.bounds.maxLng) / 2) * 1_000_000) / 1_000_000,
  };
}

export async function getForestTrailData(fetchImpl: typeof fetch = fetch) {
  if (_geometries && _courses) return { geometries: _geometries, courses: _courses };

  const res = await fetchImpl("/data/forest-trails-data.json");
  const data = await res.json();

  const geometries = data.map((geometry: any) => ({
    ...geometry,
    systemName: TRAIL_SYSTEMS[geometry.systemId as keyof typeof TRAIL_SYSTEMS].name,
  }));
  _geometries = geometries;

  const centers = Object.fromEntries(
    geometries.map((geometry: any) => [geometry.systemId, centerOfBounds(geometry)]),
  ) as Record<string, LatLng>;

  const courses = COURSE_METADATA.map(
    ([systemId, sectionName, route, distanceKm, estimatedMinutes, difficulty], index) => ({
      id: `${systemId}-${String(index + 1).padStart(2, "0")}`,
      systemId: systemId as ForestTrailCourse["systemId"],
      systemName: TRAIL_SYSTEMS[systemId as keyof typeof TRAIL_SYSTEMS].name,
      sectionName: sectionName as string,
      route: route as string,
      distanceKm: distanceKm as number,
      estimatedMinutes: estimatedMinutes as number,
      difficulty: difficulty as any,
      center: centers[systemId as string],
      source: "산림청_숲길(산림문화·휴양정보) SHP",
    }),
  );
  _courses = courses;

  return { geometries, courses };
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(a: LatLng, b: LatLng): number {
  const earthRadiusKm = 6371.0088;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function uniqueByName(trails: TrailInfo[]): TrailInfo[] {
  const seen = new Set<string>();
  return trails.filter((trail) => {
    if (seen.has(trail.name)) return false;
    seen.add(trail.name);
    return true;
  });
}

export function getNearbyForestTrails(
  point: LatLng,
  courses: ForestTrailCourse[],
  options: { limit?: number; maxDistanceKm?: number } = {},
): NearbyForestTrailCourse[] {
  const limit = options.limit ?? 3;
  const maxDistanceKm = options.maxDistanceKm ?? 80;

  return courses
    .map((course) => ({
      ...course,
      distanceFromPointKm: Math.round(distanceKm(point, course.center) * 10) / 10,
    }))
    .filter((course) => course.distanceFromPointKm <= maxDistanceKm)
    .sort((a, b) => a.distanceFromPointKm - b.distanceFromPointKm)
    .slice(0, limit);
}

export function toTrailInfo(course: ForestTrailCourse): TrailInfo {
  return {
    name: `${course.systemName} ${course.sectionName}`,
    distanceKm: course.distanceKm,
    difficulty: course.difficulty,
    estimatedMinutes: course.estimatedMinutes,
  };
}

export function enrichFacilityWithNearbyForestTrails(
  facility: FacilityInfo,
  courses: ForestTrailCourse[],
  options: { limit?: number; maxDistanceKm?: number } = {},
): FacilityInfo {
  const nearby = getNearbyForestTrails(facility, courses, options).map(toTrailInfo);
  if (nearby.length === 0) return facility;

  return {
    ...facility,
    trails: uniqueByName([...facility.trails, ...nearby]),
  };
}

export async function enrichFacilitiesWithNearbyForestTrails(
  facilities: FacilityInfo[],
  options: { limit?: number; maxDistanceKm?: number; fetchImpl?: typeof fetch } = {},
): Promise<FacilityInfo[]> {
  const { courses } = await getForestTrailData(options.fetchImpl);
  return facilities.map((facility) =>
    enrichFacilityWithNearbyForestTrails(facility, courses, options),
  );
}
