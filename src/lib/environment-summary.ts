import type { AirQualityData, AsyncStatus, WeatherData } from "@/types";

type EnvironmentBadgeVariant = "env-good" | "env-moderate" | "env-bad";

export type HomeEnvironmentBadge = {
  label: string;
  variant: EnvironmentBadgeVariant;
};

export type HomeEnvironmentSummaryInput = {
  hasLocation: boolean;
  locationStatus: AsyncStatus;
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  uvIndex: number | null;
  uvLevel: string | null;
};

export type HomeEnvironmentSummary = {
  title: string;
  line: string;
  statusLabel: "대기" | "좋음" | "보통" | "주의";
  ctaLabel: string;
  badges: HomeEnvironmentBadge[];
};

function airQualityLabel(grade: AirQualityData["khaiGrade"] | null): string {
  if (grade === 1) return "좋음";
  if (grade === 2) return "보통";
  if (grade === 3) return "나쁨";
  if (grade === 4) return "매우나쁨";
  return "정보없음";
}

function airQualityVariant(grade: AirQualityData["khaiGrade"] | null): EnvironmentBadgeVariant {
  if (grade === 1) return "env-good";
  if (grade === 2) return "env-moderate";
  return "env-bad";
}

function uvVariant(uvIndex: number | null): EnvironmentBadgeVariant {
  if (uvIndex == null) return "env-moderate";
  if (uvIndex <= 5) return "env-good";
  if (uvIndex <= 7) return "env-bad";
  return "env-bad";
}

function rainVariant(probability: number | undefined): EnvironmentBadgeVariant {
  if (probability == null) return "env-moderate";
  if (probability <= 30) return "env-good";
  if (probability <= 60) return "env-moderate";
  return "env-bad";
}

function statusFromBadges(badges: HomeEnvironmentBadge[]): HomeEnvironmentSummary["statusLabel"] {
  const badCount = badges.filter((badge) => badge.variant === "env-bad").length;
  if (badCount >= 2) return "주의";
  if (badCount === 1 || badges.some((badge) => badge.variant === "env-moderate")) return "보통";
  return "좋음";
}

export function buildHomeEnvironmentSummary(
  input: HomeEnvironmentSummaryInput,
): HomeEnvironmentSummary {
  if (!input.hasLocation) {
    return {
      title: "오늘의 치유 날씨",
      line: "현재 위치를 설정하면 날씨, 대기질, 자외선 정보를 반영합니다.",
      statusLabel: input.locationStatus === "loading" ? "대기" : "보통",
      ctaLabel: "현재 위치 사용",
      badges: [
        { label: "위치 필요", variant: "env-moderate" },
        { label: "환경 미반영", variant: "env-moderate" },
      ],
    };
  }

  const airLabel = airQualityLabel(input.airQuality?.khaiGrade ?? null);
  const uvLabel = input.uvLevel ?? "정보없음";
  const temperature = input.weather
    ? `${Math.round(input.weather.temperature)}°C`
    : "날씨 정보없음";

  const badges: HomeEnvironmentBadge[] = [
    {
      label: input.weather ? `강수 ${input.weather.precipitationProbability}%` : "강수 정보없음",
      variant: rainVariant(input.weather?.precipitationProbability),
    },
    {
      label: `대기질 ${airLabel}`,
      variant: airQualityVariant(input.airQuality?.khaiGrade ?? null),
    },
    {
      label: `UV ${uvLabel}`,
      variant: uvVariant(input.uvIndex),
    },
  ];

  return {
    title: "오늘의 치유 날씨",
    line: `${temperature} · 대기질 ${airLabel} · UV ${uvLabel}`,
    statusLabel: statusFromBadges(badges),
    ctaLabel: "환경 정보 새로고침",
    badges,
  };
}
