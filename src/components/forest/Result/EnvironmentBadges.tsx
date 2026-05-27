import { Sun, Wind, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnvironmentAssessment } from "@/types";

interface EnvironmentBadgesProps {
  assessment: EnvironmentAssessment;
}

export function EnvironmentBadges({ assessment }: EnvironmentBadgesProps) {
  const getScoreColor = (score: string) => {
    switch (score) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "poor":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const scoreLabel = {
    excellent: "매우적합",
    good: "적합",
    moderate: "보통",
    poor: "주의",
  }[assessment.overallScore];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">오늘의 치유 환경</h3>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-bold",
            getScoreColor(assessment.overallScore),
          )}
        >
          환경 점수: {assessment.suitabilityScore}점 ({scoreLabel})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-white p-3 text-center shadow-sm">
          <Sun className="mb-2 size-5 text-orange-500" />
          <span className="text-xs font-medium text-text-secondary">날씨</span>
          <span
            className="mt-0.5 text-sm font-bold text-text-primary line-clamp-1"
            title={assessment.weatherNote}
          >
            {assessment.weatherNote.split(" ")[0] || "좋음"}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-white p-3 text-center shadow-sm">
          <Wind className="mb-2 size-5 text-blue-500" />
          <span className="text-xs font-medium text-text-secondary">대기질</span>
          <span
            className="mt-0.5 text-sm font-bold text-text-primary line-clamp-1"
            title={assessment.airQualityNote}
          >
            {assessment.airQualityNote.split(" ")[0] || "좋음"}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-white p-3 text-center shadow-sm">
          <CloudSun className="mb-2 size-5 text-purple-500" />
          <span className="text-xs font-medium text-text-secondary">자외선</span>
          <span
            className="mt-0.5 text-sm font-bold text-text-primary line-clamp-1"
            title={assessment.uvNote}
          >
            {assessment.uvNote.split(" ")[0] || "보통"}
          </span>
        </div>
      </div>

      {assessment.cautions.length > 0 && (
        <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
          ⚠️ {assessment.cautions[0]}
        </div>
      )}
    </div>
  );
}
