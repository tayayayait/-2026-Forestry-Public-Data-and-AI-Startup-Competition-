import type { EffectAnalysis, VisitRecord } from "@/types";

export interface EffectAnalysisResult {
  canAnalyze: boolean;
  currentRecords: number;
  requiredRecords: number;
  message: string;
  analysis: EffectAnalysis | null;
}

const REQUIRED_RECORDS = 3;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getMostVisitedFacility(records: VisitRecord[]): string | null {
  const counts = new Map<string, number>();

  for (const record of records) {
    const facilityName = record.facilityName.trim();
    if (!facilityName) continue;
    counts.set(facilityName, (counts.get(facilityName) ?? 0) + 1);
  }

  let topFacility: string | null = null;
  let topCount = 0;
  for (const [facilityName, count] of counts) {
    if (count > topCount) {
      topFacility = facilityName;
      topCount = count;
    }
  }

  return topFacility;
}

function getFrequentActivities(records: VisitRecord[]): string[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    for (const activity of record.activities) {
      const normalizedActivity = activity.trim();
      if (!normalizedActivity) continue;
      counts.set(normalizedActivity, (counts.get(normalizedActivity) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([activity]) => activity);
}

function getTrend(stressReductionPct: number): EffectAnalysis["overallTrend"] {
  if (stressReductionPct >= 20) return "positive";
  if (stressReductionPct > 0) return "neutral";
  return "negative";
}

function buildInsights(
  records: VisitRecord[],
  stressReductionPct: number,
  averageDuration: number,
): string[] {
  const sleepImprovedCount = records.filter((record) => {
    const sleepScore = { poor: 1, normal: 2, good: 3 };
    return sleepScore[record.postSleep] > sleepScore[record.preSleep];
  }).length;
  const activities = getFrequentActivities(records);
  const insights = [
    `방문 후 스트레스가 평균 ${stressReductionPct}% 변화했습니다.`,
    `평균 체류 시간은 ${Math.round(averageDuration)}분입니다.`,
  ];

  if (sleepImprovedCount > 0) {
    insights.push(`${sleepImprovedCount}회 방문에서 수면 상태가 개선됐습니다.`);
  }

  if (activities.length > 0) {
    insights.push(`반복 활동: ${activities.join(", ")}`);
  }

  return insights;
}

export function buildEffectAnalysis(
  records: VisitRecord[],
  requiredRecords = REQUIRED_RECORDS,
): EffectAnalysisResult {
  if (records.length < requiredRecords) {
    return {
      canAnalyze: false,
      currentRecords: records.length,
      requiredRecords,
      message: `${requiredRecords}회 이상 기록 후 효과 분석을 볼 수 있습니다.`,
      analysis: null,
    };
  }

  const reductions = records
    .filter((record) => Number.isFinite(record.preStress) && record.preStress > 0)
    .map((record) => ((record.preStress - record.postStress) / record.preStress) * 100);
  const stressReductionPct = Math.round(average(reductions));
  const averageDuration = average(records.map((record) => record.durationMinutes));
  const trend = getTrend(stressReductionPct);
  const facilityName = getMostVisitedFacility(records);
  const trendLabel =
    trend === "positive" ? "개선 추세" : trend === "neutral" ? "유지 추세" : "주의 추세";

  return {
    canAnalyze: true,
    currentRecords: records.length,
    requiredRecords,
    message: "기록 기반 효과 분석이 준비됐습니다.",
    analysis: {
      overallTrend: trend,
      stressReductionPct,
      summary: `${records.length}회 방문 기록 기준 ${trendLabel}입니다. 평균 스트레스 변화율은 ${stressReductionPct}%입니다.`,
      insights: buildInsights(records, stressReductionPct, averageDuration),
      nextRecommendation: facilityName
        ? `${facilityName} 방문 패턴이 가장 안정적입니다. 동일 장소 또는 유사한 숲길 활동을 다음 코스로 우선 검토하세요.`
        : "반복 방문 장소가 아직 뚜렷하지 않습니다. 다음 방문 기록을 같은 기준으로 누적하세요.",
      disclaimer:
        "이 분석은 사용자가 입력한 방문 기록 기반 참고 정보이며 의료적 진단이나 치료 판단을 대체하지 않습니다.",
    },
  };
}
