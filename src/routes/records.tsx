import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, PlusCircle } from "lucide-react";
import * as React from "react";
import { SummaryCard } from "@/components/forest/Records/SummaryCard";
import { AchievementBadges } from "@/components/forest/Records/AchievementBadges";
import { VisitList } from "@/components/forest/Records/VisitList";
import { useVisitRecords } from "@/hooks/useVisitRecords";
import { buildEffectAnalysis } from "@/lib/effect-analysis";
import { useAppStore } from "@/stores/appStore";
import type { SleepQuality, VisitRecord } from "@/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

interface VisitRecordFormState {
  facilityName: string;
  visitDate: string;
  durationMinutes: string;
  activities: string;
  preStress: string;
  postStress: string;
  preSleep: SleepQuality;
  postSleep: SleepQuality;
  moodChange: string;
  memo: string;
}

const sleepOptions: Array<{ value: SleepQuality; label: string }> = [
  { value: "good", label: "좋음" },
  { value: "normal", label: "보통" },
  { value: "poor", label: "나쁨" },
];

function createDefaultFormState(): VisitRecordFormState {
  return {
    facilityName: "",
    visitDate: new Date().toISOString().split("T")[0],
    durationMinutes: "60",
    activities: "걷기",
    preStress: "7",
    postStress: "4",
    preSleep: "normal",
    postSleep: "normal",
    moodChange: "",
    memo: "",
  };
}

function parseActivities(value: string): string[] {
  return value
    .split(",")
    .map((activity) => activity.trim())
    .filter(Boolean);
}

function parseVisitRecord(form: VisitRecordFormState): Partial<VisitRecord> | string {
  const facilityName = form.facilityName.trim();
  const durationMinutes = Number(form.durationMinutes);
  const preStress = Number(form.preStress);
  const postStress = Number(form.postStress);

  if (!facilityName) return "방문 장소를 입력하세요.";
  if (!form.visitDate) return "방문일을 입력하세요.";
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
    return "체류 시간은 1분 이상이어야 합니다.";
  }
  if (
    !Number.isInteger(preStress) ||
    !Number.isInteger(postStress) ||
    preStress < 1 ||
    preStress > 10 ||
    postStress < 1 ||
    postStress > 10
  ) {
    return "스트레스 점수는 1~10 사이 정수로 입력하세요.";
  }

  return {
    facilityId: "custom-" + Date.now().toString(), // 임시 시설 ID
    facilityName,
    visitDate: new Date(`${form.visitDate}T00:00:00`),
    durationMinutes,
    activities: parseActivities(form.activities),
    preStress,
    postStress,
    preSleep: form.preSleep,
    postSleep: form.postSleep,
    moodChange: form.moodChange.trim() || undefined,
    memo: form.memo.trim() || undefined,
    photos: [],
  };
}

function RecordsPage() {
  const { fetchRecords, createRecord, isLoading, error } = useVisitRecords();
  const records = useAppStore((state) => state.visitHistory.records);
  const effectAnalysis = React.useMemo(() => buildEffectAnalysis(records), [records]);
  const [form, setForm] = React.useState<VisitRecordFormState>(() => createDefaultFormState());
  const [formMessage, setFormMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const updateForm = <Key extends keyof VisitRecordFormState>(
    key: Key,
    value: VisitRecordFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    const parsedRecord = parseVisitRecord(form);
    if (typeof parsedRecord === "string") {
      setFormMessage(parsedRecord);
      return;
    }

    const saved = await createRecord(parsedRecord);
    if (saved) {
      setForm(createDefaultFormState());
      setFormMessage("방문 기록이 저장됐습니다.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-center bg-warm-bg/90 backdrop-blur-md px-4 border-b border-border-subtle">
        <h1 className="text-base font-bold text-text-primary">나의 치유 기록</h1>
      </header>

      <main className="flex-1 animate-in fade-in duration-500">
        <div className="mx-auto max-w-md px-4 py-6">
          {isLoading && (
            <div className="mb-4 rounded-xl border border-border-subtle bg-white p-4 text-sm font-medium text-text-secondary">
              방문 기록을 불러오는 중입니다.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm font-medium text-coral">
              {error}
            </div>
          )}
          <SummaryCard />
          <AchievementBadges />
          <section className="mt-4 rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle className="size-5 text-forest-primary" />
              <div>
                <h2 className="text-base font-bold text-text-primary">방문 기록 입력</h2>
                <p className="text-xs text-text-secondary">
                  방문 전후 상태를 같은 기준으로 기록합니다.
                </p>
              </div>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-text-primary">
                방문 장소
                <input
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                  value={form.facilityName}
                  onChange={(event) => updateForm("facilityName", event.target.value)}
                  placeholder="예: 국립산림치유원"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-text-primary">
                  방문일
                  <input
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    type="date"
                    value={form.visitDate}
                    onChange={(event) => updateForm("visitDate", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold text-text-primary">
                  체류 시간(분)
                  <input
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    min={1}
                    type="number"
                    value={form.durationMinutes}
                    onChange={(event) => updateForm("durationMinutes", event.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold text-text-primary">
                활동
                <input
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                  value={form.activities}
                  onChange={(event) => updateForm("activities", event.target.value)}
                  placeholder="걷기, 명상, 체험"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-text-primary">
                  방문 전 스트레스
                  <input
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    max={10}
                    min={1}
                    type="number"
                    value={form.preStress}
                    onChange={(event) => updateForm("preStress", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold text-text-primary">
                  방문 후 스트레스
                  <input
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    max={10}
                    min={1}
                    type="number"
                    value={form.postStress}
                    onChange={(event) => updateForm("postStress", event.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-text-primary">
                  방문 전 수면
                  <select
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    value={form.preSleep}
                    onChange={(event) => updateForm("preSleep", event.target.value as SleepQuality)}
                  >
                    {sleepOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-text-primary">
                  방문 후 수면
                  <select
                    className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                    value={form.postSleep}
                    onChange={(event) =>
                      updateForm("postSleep", event.target.value as SleepQuality)
                    }
                  >
                    {sleepOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-text-primary">
                기분 변화
                <input
                  className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                  value={form.moodChange}
                  onChange={(event) => updateForm("moodChange", event.target.value)}
                  placeholder="예: 긴장이 줄고 집중이 쉬워짐"
                />
              </label>
              <label className="block text-sm font-semibold text-text-primary">
                메모
                <textarea
                  className="mt-1 min-h-20 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:border-forest-primary"
                  value={form.memo}
                  onChange={(event) => updateForm("memo", event.target.value)}
                  placeholder="방문 후 느낀 점을 기록하세요."
                />
              </label>
              {formMessage && (
                <p className="rounded-lg bg-warm-bg px-3 py-2 text-xs font-medium text-text-secondary">
                  {formMessage}
                </p>
              )}
              <Button className="w-full" disabled={isLoading} type="submit">
                방문 기록 저장
              </Button>
            </form>
          </section>
          <section className="mt-4 rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="size-5 text-forest-primary" />
              <div>
                <h2 className="text-base font-bold text-text-primary">효과 분석</h2>
                <p className="text-xs text-text-secondary">
                  3회 이상 기록 후 스트레스 변화와 반복 패턴을 확인합니다.
                </p>
              </div>
            </div>
            {!effectAnalysis.canAnalyze || !effectAnalysis.analysis ? (
              <div className="rounded-lg border border-dashed border-border-default bg-warm-bg p-3 text-sm font-medium text-text-secondary">
                {effectAnalysis.message} 현재 {effectAnalysis.currentRecords}회 기록됐습니다.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-forest-light p-3">
                  <p className="text-xs font-semibold text-forest-dark">평균 스트레스 변화율</p>
                  <p className="mt-1 text-2xl font-bold text-forest-dark">
                    {effectAnalysis.analysis.stressReductionPct}%
                  </p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-text-primary">
                  {effectAnalysis.analysis.summary}
                </p>
                <ul className="space-y-2">
                  {effectAnalysis.analysis.insights.map((insight) => (
                    <li
                      className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary"
                      key={insight}
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
                <p className="rounded-lg bg-warm-bg px-3 py-2 text-sm font-medium text-text-primary">
                  {effectAnalysis.analysis.nextRecommendation}
                </p>
                <p className="text-xs leading-relaxed text-text-tertiary">
                  {effectAnalysis.analysis.disclaimer}
                </p>
              </div>
            )}
          </section>
          <VisitList />
        </div>
      </main>
    </div>
  );
}
