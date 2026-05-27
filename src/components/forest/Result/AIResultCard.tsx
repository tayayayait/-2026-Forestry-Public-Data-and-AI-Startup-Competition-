import { Card } from "@/components/forest/Card";
import { Badge } from "@/components/forest/Badge";
import { Sparkles, MapPin } from "lucide-react";
import type { RecommendationResult } from "@/types";

interface AIResultCardProps {
  result: RecommendationResult;
}

export function AIResultCard({ result }: AIResultCardProps) {
  const { facility, program } = result;

  return (
    <Card className="relative overflow-hidden border-2 border-transparent bg-white shadow-md card-ai-border">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="ai" className="font-semibold">
            <Sparkles className="mr-1 size-3" />
            AI 맞춤 코스
          </Badge>
          <div className="flex items-center gap-1">
            <span className="text-sm text-text-secondary">매칭률</span>
            <span className="text-lg font-bold text-forest-700">{facility.matchScore}%</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">{program.title}</h2>

        <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
          <MapPin className="size-4" />
          <span className="font-medium text-text-primary">{facility.name}</span>
          <span className="text-border-default mx-1">|</span>
          <span>총 {program.totalDurationMinutes}분 소요</span>
        </div>

        <div className="rounded-lg bg-warm-bg p-3.5 border border-border-subtle">
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary mr-1">추천 이유:</span>
            {facility.matchReason}
          </p>
        </div>
      </div>
    </Card>
  );
}
