import * as React from "react";
import { Lightbulb, AlertTriangle, ShieldCheck } from "lucide-react";

interface CourseTipSectionProps {
  tips: string[];
}

export function CourseTipSection({ tips }: CourseTipSectionProps) {
  if (!tips || tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-warm-beige/30 p-8 text-text-tertiary">
        <Lightbulb className="mb-2 size-8 opacity-40" />
        <p className="text-sm">제공된 팁이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tips.map((tip, index) => {
        // 간단한 키워드 매칭으로 아이콘 결정
        const isWarning = tip.includes("주의") || tip.includes("위험") || tip.includes("금지");
        const isSafety = tip.includes("안전") || tip.includes("준비") || tip.includes("예약");

        const Icon = isWarning ? AlertTriangle : isSafety ? ShieldCheck : Lightbulb;
        const colorClass = isWarning
          ? "text-coral bg-coral/10"
          : isSafety
            ? "text-info bg-info/10"
            : "text-amber bg-amber/10";

        return (
          <div
            key={index}
            className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-border-subtle"
          >
            <div
              className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full p-2 ${colorClass}`}
            >
              <Icon className="size-4" />
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{tip}</p>
          </div>
        );
      })}
    </div>
  );
}
