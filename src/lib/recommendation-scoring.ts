import type {
  ActivityType,
  AirQualityData,
  FacilityInfo,
  RecommendationResult,
  SurveyAnswers,
  UVIndexData,
  WeatherData,
} from "@/types";

export type RecommendationCandidate = {
  facility: FacilityInfo;
  score: number;
  reasons: string[];
};

export type SelectRecommendationCandidateOptions = {
  facilities: FacilityInfo[];
  profile?: Partial<SurveyAnswers>;
  facilityId?: string;
};

export type BuildBaseRecommendationOptions = {
  now?: Date;
  weather?: WeatherData | null;
  airQuality?: AirQualityData | null;
  uvIndex?: UVIndexData | null;
};

const DEFAULT_REASON = "시설 정보와 기본 치유 코스 조건을 기준으로 추천했습니다.";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasActivity(profile: Partial<SurveyAnswers> | undefined, activity: string): boolean {
  return (
    profile?.preferredActivities?.includes(
      activity as SurveyAnswers["preferredActivities"][number],
    ) ?? false
  );
}

function hasAccessibilityNeed(
  profile: Partial<SurveyAnswers> | undefined,
  need: Exclude<SurveyAnswers["accessibilityNeeds"][number], "none">,
): boolean {
  return profile?.accessibilityNeeds?.includes(need) ?? false;
}

function hasEasyTrail(facility: FacilityInfo): boolean {
  return facility.trails.some((trail) => trail.difficulty === "easy");
}

function hasHardTrail(facility: FacilityInfo): boolean {
  return facility.trails.some((trail) => trail.difficulty === "hard");
}

function hasProgramKeyword(facility: FacilityInfo, keywords: string[]): boolean {
  const haystack = [...facility.programs, facility.intro ?? "", facility.name]
    .join(" ")
    .toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function scoreAccessibility(
  facility: FacilityInfo,
  profile: Partial<SurveyAnswers> | undefined,
  reasons: string[],
): number {
  let score = 0;

  if (hasAccessibilityNeed(profile, "wheelchair")) {
    if (facility.accessibility.wheelchair) {
      score += 18;
      reasons.push("휠체어 접근성 조건을 충족합니다.");
    } else {
      score -= 32;
    }
  }

  if (hasAccessibilityNeed(profile, "stroller")) {
    if (facility.accessibility.stroller) {
      score += 14;
      reasons.push("유모차 이동 조건을 충족합니다.");
    } else {
      score -= 24;
    }
  }

  if (hasAccessibilityNeed(profile, "pet")) {
    if (facility.accessibility.helpdog) {
      score += 10;
      reasons.push("반려동물/보조견 동반 조건에 더 적합합니다.");
    } else {
      score -= 12;
    }
  }

  return score;
}

function scoreActivities(
  facility: FacilityInfo,
  profile: Partial<SurveyAnswers> | undefined,
  reasons: string[],
): number {
  let score = 0;

  if (hasActivity(profile, "walking")) {
    if (facility.trails.length > 0) {
      score += 12;
      reasons.push("숲길 기반 걷기 활동이 가능합니다.");
    }
    if (hasEasyTrail(facility)) score += 8;
  }

  if (hasActivity(profile, "meditation")) {
    if (facility.type === "healing_forest") score += 12;
    if (hasProgramKeyword(facility, ["meditation", "명상", "치유"])) score += 8;
    reasons.push("정적인 치유 활동에 적합한 시설입니다.");
  }

  if (hasActivity(profile, "experience")) {
    if (
      facility.type === "education" ||
      hasProgramKeyword(facility, ["experience", "체험", "교육"])
    ) {
      score += 16;
      reasons.push("체험/교육 프로그램 연계성이 높습니다.");
    }
  }

  if (hasActivity(profile, "sports")) {
    if (
      facility.trails.some(
        (trail) => trail.difficulty === "moderate" || trail.difficulty === "hard",
      )
    ) {
      score += 12;
      reasons.push("활동량 있는 코스 구성이 가능합니다.");
    }
  }

  return score;
}

function scoreFitness(
  facility: FacilityInfo,
  profile: Partial<SurveyAnswers> | undefined,
  reasons: string[],
): number {
  if (profile?.fitnessLevel === "beginner") {
    if (hasEasyTrail(facility)) {
      reasons.push("초급자에게 부담이 적은 쉬운 숲길이 있습니다.");
      return 12;
    }
    if (hasHardTrail(facility)) return -14;
  }

  if (profile?.fitnessLevel === "advanced" && hasHardTrail(facility)) {
    reasons.push("상급 활동자에게 맞는 난도 있는 숲길이 있습니다.");
    return 10;
  }

  return 0;
}

function scoreCompanions(
  facility: FacilityInfo,
  profile: Partial<SurveyAnswers> | undefined,
  reasons: string[],
): number {
  if (profile?.companions === "family") {
    let score = 0;
    if (facility.accessibility.stroller) score += 8;
    if (hasEasyTrail(facility)) score += 6;
    if (score > 0) reasons.push("가족 동반 방문에 필요한 이동 편의성이 있습니다.");
    return score;
  }

  if (profile?.companions === "senior") {
    let score = 0;
    if (facility.accessibility.wheelchair) score += 8;
    if (hasEasyTrail(facility)) score += 8;
    if (score > 0) reasons.push("시니어 방문에 적합한 접근성과 완만한 코스가 있습니다.");
    return score;
  }

  return 0;
}

function scoreTravelTime(
  facility: FacilityInfo,
  profile: Partial<SurveyAnswers> | undefined,
): number {
  if (!facility.distanceMinutes || !profile?.maxTravelTime) return 0;
  if (facility.distanceMinutes <= profile.maxTravelTime) return 10;
  return -Math.min(20, Math.round((facility.distanceMinutes - profile.maxTravelTime) / 3));
}

export function scoreFacilityForProfile(
  facility: FacilityInfo,
  profile?: Partial<SurveyAnswers>,
): RecommendationCandidate {
  const reasons: string[] = [];
  let score = 48;

  score += scoreAccessibility(facility, profile, reasons);
  score += scoreActivities(facility, profile, reasons);
  score += scoreFitness(facility, profile, reasons);
  score += scoreCompanions(facility, profile, reasons);
  score += scoreTravelTime(facility, profile);

  if (profile?.stressLevel && profile.stressLevel >= 7 && facility.type === "healing_forest") {
    score += 8;
    reasons.push("높은 스트레스 완화를 위한 치유숲 조건이 맞습니다.");
  }

  if (
    profile?.sleepQuality === "poor" &&
    hasProgramKeyword(facility, ["meditation", "명상", "치유"])
  ) {
    score += 6;
    reasons.push("수면 리듬 안정에 도움이 되는 정적 프로그램과 연결됩니다.");
  }

  return {
    facility,
    score: clampScore(score),
    reasons: reasons.length > 0 ? reasons : [DEFAULT_REASON],
  };
}

export function selectRecommendationCandidate({
  facilities,
  profile,
  facilityId,
}: SelectRecommendationCandidateOptions): RecommendationCandidate {
  if (facilities.length === 0) {
    throw new Error("Recommendation candidate facilities are empty.");
  }

  const requestedFacility = facilityId
    ? facilities.find((facility) => facility.id === facilityId)
    : undefined;
  if (requestedFacility) {
    const candidate = scoreFacilityForProfile(requestedFacility, profile);
    return {
      ...candidate,
      reasons: ["사용자가 선택한 시설입니다.", ...candidate.reasons],
    };
  }

  return facilities
    .map((facility) => scoreFacilityForProfile(facility, profile))
    .sort(
      (left, right) =>
        right.score - left.score || left.facility.name.localeCompare(right.facility.name),
    )[0]!;
}

function pickPrimaryActivity(profile: Partial<SurveyAnswers> | undefined): ActivityType {
  const first = profile?.preferredActivities?.[0];
  if (first === "walking") return "walking";
  if (first === "meditation") return "meditation";
  if (first === "experience") return "experience";
  if (first === "sports") return "walking";
  return "forest_bathing";
}

function buildSchedule(candidate: RecommendationCandidate, profile?: Partial<SurveyAnswers>) {
  const facility = candidate.facility;
  const primaryTrail =
    facility.trails.find((trail) => trail.difficulty === "easy") ?? facility.trails[0];
  const primaryType = profile
    ? pickPrimaryActivity(profile)
    : primaryTrail
      ? "walking"
      : "forest_bathing";
  const primaryDuration = primaryTrail?.estimatedMinutes
    ? Math.min(primaryTrail.estimatedMinutes, 70)
    : 40;

  return [
    {
      order: 1,
      time: "10:00",
      activity: primaryType === "meditation" ? "숲속 호흡 명상" : "맞춤 숲길 걷기",
      type: primaryType,
      location: primaryTrail?.name ?? facility.name,
      description: candidate.reasons[0] ?? DEFAULT_REASON,
      durationMinutes: primaryDuration,
    },
    {
      order: 2,
      time: "11:10",
      activity: "자연 감각 회복",
      type: "forest_bathing" as const,
      location: facility.name,
      description: "시설 특성과 사용자 프로필을 기준으로 피로도를 낮추는 회복 시간을 배치했습니다.",
      durationMinutes: 30,
    },
  ];
}

function buildEnvironmentRecommendation(
  options: BuildBaseRecommendationOptions,
): RecommendationResult["environment"] {
  const weather = options.weather;
  const airQuality = options.airQuality;
  const uvIndex = options.uvIndex;

  const precipitationProbability = weather?.precipitationProbability ?? 10;
  const airGrade = airQuality?.khaiGrade ?? airQuality?.pm10Grade ?? airQuality?.pm25Grade ?? 2;
  const uvValue = uvIndex?.uvIndex ?? 5;
  const suitabilityScore = clampScore(
    92 -
      Math.max(0, precipitationProbability - 20) * 0.45 -
      Math.max(0, airGrade - 1) * 8 -
      Math.max(0, uvValue - 6) * 3,
  );

  return {
    overallScore:
      suitabilityScore >= 85 ? "excellent" : suitabilityScore >= 70 ? "good" : "moderate",
    suitabilityScore,
    weatherNote: weather
      ? `기온 ${weather.temperature}도, 강수확률 ${weather.precipitationProbability}% 조건을 반영했습니다.`
      : "실시간 날씨가 없어서 기본 야외 활동 조건으로 평가했습니다.",
    airQualityNote: airQuality
      ? `${airQuality.stationName} 측정소 대기질 등급 ${airGrade}를 반영했습니다.`
      : "대기질 정보가 없어서 보통 수준으로 평가했습니다.",
    uvNote: uvIndex
      ? `자외선 지수 ${uvIndex.uvIndex}(${uvIndex.uvLevel})를 반영했습니다.`
      : "자외선 정보가 없어서 모자와 수분 섭취를 권장합니다.",
    cautions: ["개인 건강 상태에 따라 활동 강도를 조절하세요."],
    recommendation: "현재 확보된 환경 조건에서는 무리 없는 숲 치유 활동을 우선 추천합니다.",
  };
}

export function buildBaseRecommendationFromFacility(
  candidate: RecommendationCandidate,
  options: BuildBaseRecommendationOptions & { profile?: Partial<SurveyAnswers> } = {},
): RecommendationResult {
  const now = options.now ?? new Date();
  const schedule = buildSchedule(candidate, options.profile);

  return {
    id: `rec-${candidate.facility.id}-${now.getTime()}`,
    facility: {
      id: candidate.facility.id,
      name: candidate.facility.name,
      type: candidate.facility.type,
      address: candidate.facility.address,
      lat: candidate.facility.lat,
      lng: candidate.facility.lng,
      matchScore: candidate.score,
      matchReason: candidate.reasons.join(" "),
    },
    program: {
      title: `${candidate.facility.name} 맞춤 치유 코스`,
      totalDurationMinutes: schedule.reduce((sum, item) => sum + item.durationMinutes, 0),
      schedule,
    },
    environment: buildEnvironmentRecommendation(options),
    expectedEffects: {
      primary: "스트레스 완화와 심리적 회복감을 기대할 수 있습니다.",
      secondary: "완만한 숲길 활동을 통해 신체 리듬 회복을 돕습니다.",
      note: "이 추천은 공공 시설 데이터와 사용자 설문 기반 안내이며 의학적 진단이 아닙니다.",
    },
    nearby: [],
    createdAt: now,
  };
}
