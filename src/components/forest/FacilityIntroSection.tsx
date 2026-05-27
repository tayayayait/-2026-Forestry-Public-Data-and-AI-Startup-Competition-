import * as React from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import type { FacilityDetailSection, FacilityInfo } from "@/types";
import { buildHomepageSearchFallbackUrl } from "@/lib/facility-homepage";
import {
  useFacilityHomepageAnalysis,
  usePinnedFacilityHomepageAnalysis,
} from "@/hooks/useFacilityHomepageAnalysis";
import { FacilityHomepageAnalysisCards } from "./FacilityHomepageAnalysisCards";

interface FacilityIntroSectionProps {
  overview?: string;
  facility: FacilityInfo;
  sections: FacilityDetailSection[];
}

const BASIC_INFO_TITLE = "기본 정보";
const SHARED_CONTACT_LABELS = new Set(["전화번호", "홈페이지"]);

function sanitizeHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function isSharedContactLabel(label: string): boolean {
  return SHARED_CONTACT_LABELS.has(label.trim());
}

export function isSourceDataSection(section: Pick<FacilityDetailSection, "title">): boolean {
  const title = section.title.trim();
  return title.includes("공공데이터") || title.includes("위치도") || title.includes("출력값");
}

export function getDisplayDetailSections(
  sections: FacilityDetailSection[],
): FacilityDetailSection[] {
  return sections
    .filter((section) => section.title !== BASIC_INFO_TITLE && !isSourceDataSection(section))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !isSharedContactLabel(item.label)),
    }))
    .filter((section) => section.items.length > 0);
}

export function getSourceDataSections(sections: FacilityDetailSection[]): FacilityDetailSection[] {
  return sections.filter(isSourceDataSection);
}

function SourceDataDisclosure({ sections }: { sections: FacilityDetailSection[] }) {
  if (sections.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-border-subtle bg-white shadow-sm [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <Database className="size-4 text-slate-500" aria-hidden />
          </div>
          <div>
            <h4 className="text-base font-bold text-text-primary">데이터 출처 / 원본 정보</h4>
            <p className="mt-1 text-xs leading-5 text-text-tertiary">
              좌표, 데이터 기준일 등 검증용 원본 필드입니다.
            </p>
          </div>
        </div>
        <ChevronDown
          className="size-4 shrink-0 text-text-tertiary transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="space-y-5 border-t border-border-subtle px-6 pb-6 pt-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-sm font-bold text-text-primary">{section.title}</p>
            <dl className="mt-3 space-y-3">
              {section.items.map((item, index) => (
                <div key={`${section.title}-${item.label}-${index}`}>
                  <dt className="text-xs font-semibold text-text-tertiary">{item.label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium leading-6 text-text-primary">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}

export function FacilityIntroSection({ overview, facility, sections }: FacilityIntroSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const {
    mutate: analyzeHomepage,
    data: homepageAnalysisResult,
    error: homepageAnalysisError,
    isPending: isHomepageAnalysisPending,
  } = useFacilityHomepageAnalysis();
  const { data: pinnedHomepageAnalysisResult } = usePinnedFacilityHomepageAnalysis(
    facility.homepage,
  );
  const cleanOverview = sanitizeHtml(overview);
  const isLong = cleanOverview.length > 200;
  const displaySections = getDisplayDetailSections(sections);
  const sourceDataSections = getSourceDataSections(sections);
  const displayedHomepageAnalysisResult =
    homepageAnalysisResult ?? pinnedHomepageAnalysisResult ?? null;

  const handleAnalyzeHomepage = React.useCallback(() => {
    if (!facility.homepage) return;
    analyzeHomepage({
      facilityName: facility.name,
      homepageUrl: facility.homepage,
      facilityType: facility.type,
      address: facility.address,
    });
  }, [analyzeHomepage, facility.address, facility.homepage, facility.name, facility.type]);

  return (
    <div className="space-y-6">
      {cleanOverview && (
        <div className="rounded-2xl border border-border-subtle bg-white p-6 shadow-sm">
          <h4 className="mb-3 text-base font-bold text-text-primary">시설 소개</h4>
          <div className="relative">
            <p
              className={`whitespace-pre-line text-[15px] leading-[1.8] text-text-secondary ${
                !isExpanded && isLong ? "line-clamp-6" : ""
              }`}
            >
              {cleanOverview}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 flex cursor-pointer items-center gap-1 text-sm font-semibold text-forest-700 transition-colors hover:text-forest-800"
              >
                {isExpanded ? (
                  <>
                    접기 <ChevronUp className="size-4" aria-hidden />
                  </>
                ) : (
                  <>
                    더보기 <ChevronDown className="size-4" aria-hidden />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-base font-bold text-text-primary">기본 정보</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50">
              <MapPin className="size-4 text-forest-600" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-tertiary">주소</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {facility.address || "주소 정보 없음"}
              </p>
            </div>
          </div>

          {facility.tel && (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky/10">
                <Phone className="size-4 text-sky" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-tertiary">전화번호</p>
                <a
                  href={`tel:${facility.tel}`}
                  className="mt-0.5 text-sm font-medium text-text-primary transition-colors hover:text-forest-700"
                >
                  {facility.tel}
                </a>
              </div>
            </div>
          )}

          {facility.homepage && (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                <ExternalLink className="size-4 text-indigo-500" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-tertiary">홈페이지</p>
                <a
                  href={facility.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 text-sm font-medium text-indigo-600 underline underline-offset-2 transition-colors hover:text-indigo-700"
                >
                  공식 홈페이지 바로가기
                </a>
                <a
                  href={buildHomepageSearchFallbackUrl(facility.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  <Search className="size-3" aria-hidden />
                  접속이 안 될 경우 검색으로 찾기
                </a>
                <button
                  type="button"
                  onClick={handleAnalyzeHomepage}
                  disabled={isHomepageAnalysisPending}
                  className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-forest-200 bg-forest-50 px-3 text-xs font-bold text-forest-800 transition-colors hover:bg-forest-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isHomepageAnalysisPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden />
                  )}
                  {isHomepageAnalysisPending
                    ? "공식 홈페이지 분석 중"
                    : displayedHomepageAnalysisResult
                      ? "공식 홈페이지 분석 결과 보기"
                      : "공식 홈페이지 분석하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {homepageAnalysisError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p>{homepageAnalysisError.message}</p>
            {facility.homepage && (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={facility.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-amber-900"
                >
                  공식 홈페이지 열기
                </a>
                <a
                  href={buildHomepageSearchFallbackUrl(facility.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-amber-900"
                >
                  검색으로 찾기
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {displayedHomepageAnalysisResult && (
        <FacilityHomepageAnalysisCards analysis={displayedHomepageAnalysisResult} />
      )}

      {displaySections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-border-subtle bg-white p-6 shadow-sm"
        >
          <h4 className="mb-3 text-base font-bold text-text-primary">{section.title}</h4>
          <dl className="space-y-3">
            {section.items.map((item, index) => (
              <div key={`${section.title}-${item.label}-${index}`}>
                <dt className="text-xs font-semibold text-text-tertiary">{item.label}</dt>
                <dd className="mt-1 break-words whitespace-pre-line text-sm font-medium leading-6 text-text-primary">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <SourceDataDisclosure sections={sourceDataSections} />
    </div>
  );
}
