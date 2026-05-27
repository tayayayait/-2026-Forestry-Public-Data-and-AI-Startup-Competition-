import {
  BookOpen,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
  Navigation,
  Phone,
  Search,
  Tags,
} from "lucide-react";
import type { FacilityInfo, ForestEducationProgram } from "@/types";
import { buildHomepageSearchFallbackUrl } from "@/lib/facility-homepage";

interface ProgramInfoSectionProps {
  facility: FacilityInfo;
}

type ProgramFact = {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  href?: string;
};

export function getProgramDisplayTitle(program: ForestEducationProgram): string {
  return program.title?.trim() || program.facilityName?.trim() || "산림교육 프로그램";
}

export function buildProgramFacts(program: ForestEducationProgram): ProgramFact[] {
  return [
    {
      label: "운영기간",
      value: program.period?.trim() ?? "",
      icon: CalendarDays,
    },
    {
      label: "프로그램 분류",
      value: program.category?.trim() ?? "",
      icon: Tags,
    },
    {
      label: "관리기관",
      value: program.managementAgency?.trim() ?? "",
      icon: Building2,
    },
    {
      label: "문의",
      value: program.tel?.trim() ?? "",
      icon: Phone,
      href: program.tel ? `tel:${program.tel}` : undefined,
    },
    {
      label: "주소",
      value: program.address?.trim() ?? "",
      icon: MapPin,
    },
    {
      label: "담당부서",
      value: program.department?.trim() ?? "",
      icon: FileText,
    },
    {
      label: "등록일",
      value: program.registeredAt?.trim() ?? "",
      icon: CalendarDays,
    },
  ].filter((fact) => fact.value);
}

export function orderEducationPrograms(
  programs: ForestEducationProgram[],
): ForestEducationProgram[] {
  return [...programs].sort((left, right) => {
    const leftHasContent = left.content.trim().length > 0;
    const rightHasContent = right.content.trim().length > 0;
    if (leftHasContent === rightHasContent) return 0;

    return leftHasContent ? -1 : 1;
  });
}

function getDetailSectionValue(facility: FacilityInfo, label: string): string | undefined {
  return facility.detailSections
    ?.flatMap((section) => section.items)
    .find((item) => item.label.trim() === label)?.value;
}

function formatProgramLabel(program: string): string {
  const trimmed = program.trim();
  if (!trimmed) return "프로그램";
  return trimmed.includes("프로그램") ? trimmed : `${trimmed} 프로그램`;
}

export function buildFacilityProgramFallbacks(facility: FacilityInfo): ForestEducationProgram[] {
  if (facility.type === "kids_forest") {
    return orderEducationPrograms(facility.educationPrograms ?? []);
  }

  return [];
}

function buildReservationCopy(facility: FacilityInfo): { title: string; description: string } {
  if (facility.type === "recreation_forest") {
    return {
      title: "자연휴양림 프로그램 예약",
      description:
        "객실, 체험, 교육 프로그램은 숲나들e 또는 해당 시설의 공식 홈페이지에서 예약 가능 여부를 확인해야 합니다.",
    };
  }

  if (facility.type === "healing_forest") {
    return {
      title: "치유의숲 프로그램 예약",
      description:
        "산림치유 프로그램은 산림복지진흥원, 지자체 예약 시스템, 또는 시설별 공식 채널에서 사전 예약으로 운영됩니다.",
    };
  }

  if (facility.type === "arboretum") {
    return {
      title: "수목원 관람 및 체험 안내",
      description:
        "입장, 해설, 체험 프로그램 운영 여부는 수목원 공식 홈페이지의 최신 공지를 우선 확인해야 합니다.",
    };
  }

  return {
    title: "산림 프로그램 예약 안내",
    description:
      "시설별 교육 및 체험 프로그램은 공식 홈페이지나 관리기관 문의를 통해 최신 운영 여부를 확인해야 합니다.",
  };
}

function ProgramFactGrid({ facts }: { facts: ProgramFact[] }) {
  if (facts.length === 0) return null;

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {facts.map((fact) => {
        const Icon = fact.icon;
        const value = (
          <div className="flex min-h-14 gap-3 rounded-lg border border-border-subtle bg-white px-3 py-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-text-tertiary">{fact.label}</dt>
              <dd className="mt-0.5 break-words text-sm font-semibold leading-5 text-text-primary">
                {fact.value}
              </dd>
            </div>
          </div>
        );

        return fact.href ? (
          <a
            key={`${fact.label}-${fact.value}`}
            href={fact.href}
            className="block cursor-pointer rounded-lg transition-colors hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
          >
            {value}
          </a>
        ) : (
          <div key={`${fact.label}-${fact.value}`}>{value}</div>
        );
      })}
    </dl>
  );
}

function EducationProgramCard({
  program,
  index,
}: {
  program: ForestEducationProgram;
  index: number;
}) {
  const title = getProgramDisplayTitle(program);
  const facts = buildProgramFacts(program);

  return (
    <article className="rounded-lg border border-forest-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
          <BookOpen className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-forest-700">시설 프로그램 정보 {index + 1}</p>
          <h4 className="mt-1 break-words text-base font-extrabold leading-6 text-text-primary">
            {title}
          </h4>
          {program.content && (
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-text-secondary">
              {program.content}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ProgramFactGrid facts={facts} />
      </div>
    </article>
  );
}

function ReservationActions({ facility }: { facility: FacilityInfo }) {
  const copy = buildReservationCopy(facility);
  const targetHref = facility.homepage ?? buildHomepageSearchFallbackUrl(facility.name);

  return (
    <div className="rounded-lg border border-amber/20 bg-amber/5 p-5">
      <div className="flex gap-3">
        <Navigation className="mt-0.5 size-5 shrink-0 text-amber" aria-hidden />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-text-primary">{copy.title}</h4>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{copy.description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={targetHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
        >
          {facility.homepage ? "공식 채널 열기" : "프로그램 검색하기"}
          {facility.homepage ? (
            <ExternalLink className="size-4" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
        </a>

        {facility.tel && (
          <a
            href={`tel:${facility.tel}`}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-forest-100 bg-white px-4 py-2 text-sm font-bold text-forest-700 transition-colors hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2"
          >
            <Phone className="size-4" aria-hidden />
            전화 문의
          </a>
        )}
      </div>
    </div>
  );
}

export function ProgramInfoSection({ facility }: ProgramInfoSectionProps) {
  const displayPrograms = buildFacilityProgramFallbacks(facility);

  return (
    <div className="space-y-5">
      {displayPrograms.length > 0 && (
        <section className="space-y-3" aria-labelledby="facility-programs-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="facility-programs-heading"
                className="text-base font-extrabold text-text-primary"
              >
                시설 프로그램 정보
              </h3>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                시설 기본정보와 공식 채널 기준으로 확인 가능한 프로그램 정보입니다.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-bold text-forest-700">
              {displayPrograms.length}건
            </span>
          </div>
          <div className="space-y-3">
            {displayPrograms.map((program, index) => (
              <EducationProgramCard
                key={`${getProgramDisplayTitle(program)}-${program.address ?? ""}-${index}`}
                program={program}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      <ReservationActions facility={facility} />
    </div>
  );
}
