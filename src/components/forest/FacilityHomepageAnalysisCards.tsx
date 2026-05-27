import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  FileText,
  Info,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type {
  FacilityHomepageAnalysis,
  FacilityHomepageAnalysisSection,
  FacilityHomepageAnalysisSectionType,
} from "@/types";

const SECTION_LABELS: Record<FacilityHomepageAnalysisSectionType, string> = {
  summary: "요약",
  usage: "이용안내",
  hours: "운영시간",
  fees: "요금",
  reservation: "예약",
  cautions: "주의사항",
};

const SECTION_ICONS: Record<FacilityHomepageAnalysisSectionType, LucideIcon> = {
  summary: FileText,
  usage: Info,
  hours: Clock,
  fees: Wallet,
  reservation: CalendarCheck,
  cautions: ShieldAlert,
};

const SECTION_ORDER: FacilityHomepageAnalysisSectionType[] = [
  "summary",
  "usage",
  "hours",
  "fees",
  "reservation",
  "cautions",
];

export function getRenderableHomepageAnalysisSections(
  analysis: FacilityHomepageAnalysis,
): FacilityHomepageAnalysisSection[] {
  return [...analysis.sections]
    .filter((section) => section.status !== "not_found" && section.items.length > 0)
    .sort((left, right) => SECTION_ORDER.indexOf(left.type) - SECTION_ORDER.indexOf(right.type));
}

function AnalysisSectionCard({ section }: { section: FacilityHomepageAnalysisSection }) {
  const Icon = SECTION_ICONS[section.type];

  return (
    <article className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h5 className="text-sm font-bold text-text-primary">{SECTION_LABELS[section.type]}</h5>
          {section.status === "uncertain" && (
            <p className="mt-0.5 text-xs font-medium text-amber-700">출처 근거가 제한적입니다.</p>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {section.items.map((item, index) => (
          <li key={`${section.type}-${index}`} className="text-sm leading-6 text-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function FacilityHomepageAnalysisCards({
  analysis,
}: {
  analysis: FacilityHomepageAnalysis;
}) {
  const renderableSections = getRenderableHomepageAnalysisSections(analysis);

  return (
    <section className="space-y-4" aria-label="공식 홈페이지 분석 결과">
      <div className="rounded-2xl border border-forest-100 bg-forest-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-forest-700">
            <FileText className="size-4" aria-hidden />
          </span>
          <div>
            <h4 className="text-base font-bold text-text-primary">공식 홈페이지 분석 결과</h4>
            <p className="mt-1 text-xs leading-5 text-text-tertiary">
              Gemini가 공식 홈페이지에서 확인 가능한 항목만 정리했습니다.
            </p>
          </div>
        </div>
        {analysis.retrievalStatus !== "success" && (
          <p className="mt-4 flex gap-2 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {analysis.warning ?? "일부 페이지는 접근이 제한되어 부분 분석 결과입니다."}
          </p>
        )}
      </div>

      {renderableSections.length > 0 ? (
        <div className="grid gap-3">
          {renderableSections.map((section) => (
            <AnalysisSectionCard key={section.type} section={section} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-white p-5 text-sm leading-6 text-text-secondary shadow-sm">
          공식 홈페이지에서 카드로 표시할 수 있는 핵심 항목을 확인하지 못했습니다.
        </div>
      )}

    </section>
  );
}
