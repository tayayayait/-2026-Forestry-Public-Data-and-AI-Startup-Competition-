import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { ArrowLeft, Save, Calendar, Share2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { apiClient } from "@/lib/api-client";
import { useSavedCourses } from "@/hooks/useSavedCourses";
import { AIResultCard } from "@/components/forest/Result/AIResultCard";
import { EnvironmentBadges } from "@/components/forest/Result/EnvironmentBadges";
import { ExpectedEffects } from "@/components/forest/Result/ExpectedEffects";
import { Timeline } from "@/components/forest/Result/Timeline";
import { NearbyPlaces } from "@/components/forest/Result/NearbyPlaces";
import { Button } from "@/components/forest/Button";
import type { RecommendationResult } from "@/types";

export const Route = createFileRoute("/result/$id")({
  component: ResultDetailPage,
});

function ResultDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { createCourse, isLoading: isSaving, error: saveError } = useSavedCourses();
  const [persistedResult, setPersistedResult] = React.useState<RecommendationResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSaved, setIsSaved] = React.useState(false);

  // 스토어에서 해당 id의 추천 결과를 찾습니다.
  // 실제 프로덕션에서는 React Query를 통해 단건 조회 API를 호출해야 합니다.
  const history = useAppStore((s) => s.recommendation.history);
  const cachedResult = history.find((r) => r.id === id) || history[0];
  const result = cachedResult ?? persistedResult;

  React.useEffect(() => {
    if (cachedResult) return;

    let active = true;
    setIsLoadingResult(true);
    setLoadError(null);

    apiClient
      .getRecommendation(id)
      .then((response) => {
        if (!active) return;
        if (response.success && response.data) {
          setPersistedResult(response.data);
        } else {
          setLoadError(response.error ?? "추천 결과를 불러오지 못했습니다.");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "추천 결과를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setIsLoadingResult(false);
      });

    return () => {
      active = false;
    };
  }, [cachedResult, id]);

  const handleSaveCourse = async () => {
    if (!result || isSaved) return;

    const savedCourse = await createCourse({
      recommendationId: result.id,
      title: result.program.title,
      facilityName: result.facility.name,
      isBookmarked: true,
    });

    if (savedCourse) {
      setIsSaved(true);
    }
  };

  if (isLoadingResult) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-warm-bg">
        <p className="text-sm font-medium text-text-secondary">추천 결과를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-warm-bg">
        <h1 className="text-xl font-bold text-text-primary mb-2">결과를 찾을 수 없습니다</h1>
        <p className="text-sm text-text-secondary mb-6">
          {loadError ?? "만료되었거나 유효하지 않은 추천 코스입니다."}
        </p>
        <Button onClick={() => navigate({ to: "/" })}>홈으로 가기</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-warm-bg/90 backdrop-blur-md px-4 border-b border-border-subtle">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-border-subtle"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="text-base font-bold text-text-primary">맞춤 치유 코스</h1>
        <div className="flex items-center gap-2">
          <button className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-border-subtle">
            <Share2 className="size-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 animate-in fade-in duration-500">
        <div className="mx-auto max-w-md px-4 py-6 space-y-8">
          {/* 1. 메인 AI 결과 카드 */}
          <section aria-label="추천 요약">
            <AIResultCard result={result} />
            {saveError && <p className="mt-3 text-sm font-medium text-coral">{saveError}</p>}
          </section>

          {/* 2. 환경 및 배지 */}
          <section aria-label="치유 환경 평가">
            <EnvironmentBadges assessment={result.environment} />
          </section>

          <hr className="border-border-subtle" />

          {/* 3. 코스 타임라인 */}
          <section aria-label="코스 일정">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">상세 일정</h3>
              <span className="text-sm font-medium text-text-tertiary">
                총 {result.program.totalDurationMinutes}분
              </span>
            </div>
            <Timeline schedule={result.program.schedule} />
          </section>

          {/* 4. 기대 효과 */}
          <section aria-label="기대 효과">
            <ExpectedEffects effects={result.expectedEffects} />
          </section>

          {/* 5. 주변 추천 */}
          {result.nearby && result.nearby.length > 0 && (
            <section aria-label="주변 장소">
              <NearbyPlaces places={result.nearby} />
            </section>
          )}
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-white p-4 pb-safe flex gap-3 shadow-lg lg:hidden">
        <Button
          variant="secondary"
          className="flex-1 gap-2"
          onClick={handleSaveCourse}
          loading={isSaving}
          disabled={isSaved}
        >
          <Save className="size-4" /> {isSaved ? "저장됨" : "저장"}
        </Button>
        <Button variant="primary" className="flex-[2] gap-2">
          <Calendar className="size-4" /> 방문 예약하기
        </Button>
      </div>
    </div>
  );
}
