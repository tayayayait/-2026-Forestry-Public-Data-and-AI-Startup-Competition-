import { HeartPulse, Brain } from "lucide-react";
import type { RecommendationResult } from "@/types";

interface ExpectedEffectsProps {
  effects: RecommendationResult["expectedEffects"];
}

export function ExpectedEffects({ effects }: ExpectedEffectsProps) {
  return (
    <div className="rounded-xl bg-forest-50 p-4 border border-forest-100">
      <h3 className="mb-4 text-base font-bold text-forest-900">기대되는 치유 효과</h3>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-forest-600 shadow-sm">
            <HeartPulse className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{effects.primary}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-forest-600 shadow-sm">
            <Brain className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">{effects.secondary}</p>
          </div>
        </div>
      </div>

      {effects.note && <p className="mt-4 text-[11px] text-text-tertiary">{effects.note}</p>}
    </div>
  );
}
