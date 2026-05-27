// ──────────────────────────────────────────────────────────────
// 🌿 숲 테라피 AI — Core Type Definitions
// 상세서 Section 8.2 + 프로젝트개요 기반
// ──────────────────────────────────────────────────────────────

/* ── 비동기 상태 패턴 ── */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

/* ── 설문 (Survey) ── */
export type SleepQuality = "good" | "normal" | "poor";
export type FitnessLevel = "beginner" | "moderate" | "advanced";
export type PreferredActivity = "walking" | "meditation" | "experience" | "sports";
export type CompanionType = "solo" | "couple" | "family" | "senior";
export type TravelTime = 30 | 60 | 120;
export type AccessibilityNeed = "none" | "wheelchair" | "stroller" | "pet";

export interface SurveyAnswers {
  stressLevel: number; // 1~10
  sleepQuality: SleepQuality;
  fitnessLevel: FitnessLevel;
  preferredActivities: PreferredActivity[];
  companions: CompanionType;
  maxTravelTime: TravelTime;
  accessibilityNeeds: AccessibilityNeed[];
}

export interface SurveyStepConfig {
  step: number;
  question: string;
  description: string;
  type: "slider" | "single" | "multi";
  field: keyof SurveyAnswers;
  options?: { value: string; label: string; emoji?: string }[];
  min?: number;
  max?: number;
  required: boolean;
}

/* ── 건강 프로필 ── */
export interface HealthProfile extends SurveyAnswers {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ── 환경 데이터 ── */
export type SkyCondition = "맑음" | "구름많음" | "흐림";
export type PrecipitationType = "없음" | "비" | "비/눈" | "눈" | "소나기";

export interface WeatherData {
  temperature: number;
  minTemp: number;
  maxTemp: number;
  sky: SkyCondition;
  precipitationType: PrecipitationType;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
}

export type AirQualityGrade = 1 | 2 | 3 | 4; // 1:좋음 2:보통 3:나쁨 4:매우나쁨

export interface AirQualityData {
  dataTime: string;
  pm10Value: number | null;
  pm25Value: number | null;
  o3Value: number | null;
  khaiValue: number | null;
  khaiGrade: AirQualityGrade | null;
  pm10Grade: AirQualityGrade | null;
  pm25Grade: AirQualityGrade | null;
  stationName: string;
  stationCode?: string;
  stationAddress?: string;
  stationLat?: number;
  stationLng?: number;
  stationDistanceKm?: number;
  mangName?: string;
}

export type UVLevel = "낮음" | "보통" | "높음" | "매우높음" | "위험";

export interface UVIndexData {
  areaNo: string;
  areaName: string;
  date: string;
  uvIndex: number;
  uvLevel: UVLevel;
  forecastHour: number;
}

export interface EnvironmentData {
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  uvIndex: number | null;
  uvLevel: UVLevel | null;
  lastUpdated: Date | null;
}

/* ── 환경 적합성 ── */
export type SuitabilityLevel = "excellent" | "good" | "moderate" | "poor";

export interface EnvironmentAssessment {
  overallScore: SuitabilityLevel;
  suitabilityScore: number; // 0~100
  weatherNote: string;
  airQualityNote: string;
  uvNote: string;
  cautions: string[];
  recommendation: string;
}

/* ── 시설 정보 ── */
export type FacilityType =
  | "recreation_forest"
  | "healing_forest"
  | "kids_forest"
  | "arboretum"
  | "education"
  | "traditional_village_forest";

export interface TrailInfo {
  name: string;
  distanceKm: number;
  difficulty: "easy" | "moderate" | "hard";
  estimatedMinutes: number;
}

export type ForestTrailSystemId = "jirisan-dulegil" | "geumgang-pine-trail" | "punchbowl-dulegil";

export interface ForestTrailCourse {
  id: string;
  systemId: ForestTrailSystemId;
  systemName: string;
  sectionName: string;
  route: string;
  distanceKm: number;
  estimatedMinutes: number;
  difficulty: TrailInfo["difficulty"];
  center: {
    lat: number;
    lng: number;
  };
  source: string;
}

export interface ForestTrailGeometry {
  systemId: ForestTrailSystemId;
  systemName: string;
  color: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  paths: Array<Array<{ lat: number; lng: number }>>;
}

export interface FacilityAccessibility {
  wheelchair: boolean;
  stroller: boolean;
  parking: boolean;
  restroom: boolean;
  elevator: boolean;
  helpdog: boolean;
}

export interface FacilityDetailItem {
  label: string;
  value: string;
}

export interface FacilityDetailSection {
  title: string;
  items: FacilityDetailItem[];
}

export interface FacilityInfo {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  lat: number;
  lng: number;
  tel?: string;
  homepage?: string;
  intro?: string;
  operatingHours?: string;
  maxCapacity?: number;
  programs: string[];
  trails: TrailInfo[];
  accessibility: FacilityAccessibility;
  detailSections?: FacilityDetailSection[];
  imageUrl?: string;
  distanceMinutes?: number;
  educationPrograms?: ForestEducationProgram[];
}

export type FacilityHomepageAnalysisSectionType =
  | "summary"
  | "usage"
  | "hours"
  | "fees"
  | "reservation"
  | "cautions";

export type FacilityHomepageAnalysisSectionStatus = "found" | "not_found" | "uncertain";

export type FacilityHomepageAnalysisRetrievalStatus = "success" | "partial" | "failed";

export interface FacilityHomepageAnalysisSection {
  type: FacilityHomepageAnalysisSectionType;
  title: string;
  status: FacilityHomepageAnalysisSectionStatus;
  items: string[];
  sourceUrls: string[];
}

export interface FacilityHomepageAnalysis {
  facilityName: string;
  homepageUrl: string;
  analyzedAt: string;
  retrievalStatus: FacilityHomepageAnalysisRetrievalStatus;
  sections: FacilityHomepageAnalysisSection[];
  missingSections: FacilityHomepageAnalysisSectionType[];
  sourceUrls: string[];
  warning?: string;
}

export interface ForestEducationProgram {
  /** ODCloud 원본 필드: 시설명 */
  title: string;
  /** 빈 문자열 (ODCloud에서 상세 내용 미제공) */
  content: string;
  /** ODCloud 원본 필드: 시설명 (하위 호환용 alias) */
  facilityName?: string;
  /** ODCloud 원본 필드: 주소 */
  address?: string;
  /** ODCloud 원본 필드: 운영기간 */
  period?: string;
  /** ODCloud 원본 필드: 관리주체 */
  managementAgency?: string;
  /** ODCloud 원본 필드: 전화번호 */
  tel?: string;
  /** ODCloud 원본 필드: 참여방법 */
  participationMethod?: string;
  /** ODCloud 원본 필드: 연번 */
  serialNumber?: number;
  /** 레거시 호환 필드 */
  registeredAt?: string;
  registrar?: string;
  department?: string;
  category?: string;
}

export interface ForestEducationProgramList {
  items: ForestEducationProgram[];
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
}

export interface RecreationForest {
  name: string;
  provinceName: string;
  type?: string;
  area?: string;
  capacity: number | null;
  admissionFee?: string;
  stayingAvailable: boolean | null;
  mainFacilities?: string;
  roadAddress?: string;
  institutionName?: string;
  telephoneNumber?: string;
  homepageUrl?: string;
  latitude: number | null;
  longitude: number | null;
  referenceDate?: string;
  providerCode?: string;
}

export interface RecreationForestList {
  items: RecreationForest[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  resultCode: string;
  resultMsg: string;
}

export interface TraditionalVillageForest {
  name: string;
  address?: string;
  mainTreeSpecies?: string;
  mainForestType?: string;
  historyContent?: string;
  cultureContent?: string;
  zoneAreaSquareMeters: number | null;
}

export interface TraditionalVillageForestList {
  items: TraditionalVillageForest[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  resultCode: string;
  resultMsg: string;
}

export interface GeocodingResult {
  query: string;
  roadAddress?: string;
  jibunAddress?: string;
  lat: number;
  lng: number;
}

export interface HealingForestStatus {
  serialNumber: number | null;
  region: string;
  facilityName: string;
  address: string;
  telephoneNumber?: string;
  homepage?: string;
  participationMethod?: string;
  operator?: string;
}

export interface HealingForestList {
  items: HealingForestStatus[];
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
}

export interface ForestPlantStory {
  id: string;
  category?: string;
  name: string;
  englishName?: string;
  guide?: string;
  scientificName?: string;
  className?: string;
  habitat?: string;
  lifetime?: string;
  offer?: string;
  registeredAt?: string;
  story?: string;
}

export interface ForestPlantStoryList {
  items: ForestPlantStory[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  resultCode: string;
  resultMsg: string;
}

export interface ForestPlantImage {
  id: string;
  name: string;
  fileName: string;
}

export interface ForestPlantImageList {
  items: ForestPlantImage[];
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  resultCode: string;
  resultMsg: string;
}

/* ── AI 추천 결과 ── */
export type ActivityType =
  | "forest_bathing"
  | "meditation"
  | "walking"
  | "education"
  | "yoga"
  | "experience"
  | "observation";

export interface ScheduleItem {
  order: number;
  time: string;
  activity: string;
  type: ActivityType;
  location: string;
  description: string;
  durationMinutes: number;
}

export interface NearbyPlace {
  type: "restaurant" | "cafe" | "attraction";
  contentId?: string;
  contentTypeId?: string;
  name: string;
  distance: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  tel?: string;
  lat?: number;
  lng?: number;
  accessibility?: FacilityAccessibility;
  accessibilityNotes?: string[];
}

export interface RecommendationResult {
  id: string;
  facility: {
    id: string;
    name: string;
    type: FacilityType;
    address: string;
    lat: number;
    lng: number;
    matchScore: number; // 0~100
    matchReason: string;
  };
  program: {
    title: string;
    totalDurationMinutes: number;
    schedule: ScheduleItem[];
  };
  environment: EnvironmentAssessment;
  expectedEffects: {
    primary: string;
    secondary: string;
    note: string;
  };
  nearby: NearbyPlace[];
  createdAt: Date;
}

/* ── 방문 기록 ── */
export interface SavedCourse {
  id: string;
  userId: string;
  recommendationId?: string;
  title: string;
  facilityName: string;
  memo?: string;
  isBookmarked: boolean;
  recommendation?: RecommendationResult | null;
  createdAt: Date;
}

export interface VisitRecord {
  id: string;
  userId: string;
  recommendationId?: string;
  facilityId?: string; // Add this missing property
  facilityName: string;
  visitDate: Date;
  durationMinutes: number;
  activities: string[];
  preStress: number; // 1~10
  postStress: number; // 1~10
  preSleep: SleepQuality;
  postSleep: SleepQuality;
  moodChange?: string;
  memo?: string;
  photos: string[];
  createdAt: Date;
}

/* ── AI 효과 분석 ── */
export interface EffectAnalysis {
  overallTrend: "positive" | "neutral" | "negative";
  stressReductionPct: number;
  summary: string;
  insights: string[];
  nextRecommendation: string;
  disclaimer: string;
}

/* ── 위치 ── */
export type LocationPermission = "prompt" | "granted" | "denied";

export interface UserLocation {
  coords: { lat: number; lng: number } | null;
  address: string | null;
  permission: LocationPermission;
}

/* ── 데이터 기반 추천 탐색 ── */
export type CurationId =
  | "registered-healing-forest"
  | "activity-recreation-forest"
  | "small-capacity-recreation-forest"
  | "lodging-recreation-forest"
  | "beginner-trail"
  | "family-outing"
  | "forest-camping"
  | "meditation-healing"
  | "seasonal-spring"
  | "seasonal-summer"
  | "seasonal-autumn"
  | "seasonal-winter";

export interface CurationItem {
  id: CurationId;
  label: string;
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  facilityId?: string;
  accentColor: string;
}

/* ── 식물 정보 ── */
export interface PlantInfo {
  id: string;
  name: string;
  scientificName: string;
  imageUrl?: string;
  description: string;
  usage?: string;
  habitat?: string;
  floweringSeason?: string;
}

/* ── 사용자 프로필 ── */
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ── 뱃지 시스템 ── */
export type BadgeId =
  | "healing_runner"
  | "forest_explorer"
  | "meditation_master"
  | "nature_lover"
  | "season_collector";

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

/* ── API 응답 래퍼 ── */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  cached?: boolean;
}

/* ── 지도 마커 ── */
export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  type: FacilityType;
  name: string;
  address: string;
  suitability?: SuitabilityLevel;
  distanceMinutes?: number;
  rating?: number;
}

/* ── 상세 페이지용 타입 ── */
export interface WaypointInfo {
  order: number;
  name: string;
  description?: string; // 옵셔널로 변경 (경유지 자체 설명이 없을 수도 있음)
  imageUrl?: string; // API에서 제공하는 단일 이미지 (detailInfo2.subdetailimg)
  tags?: string[]; // 예: '암릉', '로프'
  images?: string[]; // 여러 장의 이미지를 위해 추가
  tips?: {
    title: string;
    description: string;
    imageUrl?: string;
  }[]; // 구간별 말풍선 팁
  facilities?: string[]; // 예: '안내소', '주차장', '화장실'
}

export interface TransportDetail {
  publicTransport?: string;
  selfDriving?: string;
  parking?: string;
  infoCenter?: string;
}

/* ── 사진 콘텐츠 카테고리 시스템 ── */

/** 사진 콘텐츠 카테고리 */
export type PhotoCategory = "scenery" | "facility" | "experience" | "etc";

/** 카테고리가 부여된 개별 이미지 */
export interface CategorizedImage {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  category: PhotoCategory;
  source?: "tourapi" | "kakao" | "waypoint" | "naver-official" | "naver";
}

/** 카테고리별 그룹화된 사진 갤러리 데이터 */
export interface PhotoGalleryData {
  scenery: CategorizedImage[];
  facility: CategorizedImage[];
  experience: CategorizedImage[];
  etc: CategorizedImage[];
  all: CategorizedImage[];
}

export interface FacilityFullDetail {
  contentId?: string;
  overview?: string;
  images: string[];
  imageDetails?: { url: string; caption?: string }[];
  photoGallery?: PhotoGalleryData;
  transport?: TransportDetail;
  usageInfo?: {
    useTime?: string;
    useFee?: string;
    restDate?: string;
    infoCenter?: string;
  };
  waypoints: WaypointInfo[];
  tips: string[];
  courseDifficulty?: string;
  courseDistance?: string;
  courseTime?: string;
  courseTheme?: string;
}
