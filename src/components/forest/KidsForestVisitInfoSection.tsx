import { CalendarDays, CheckCircle2, ClipboardList, MapPin, Phone } from "lucide-react";
import type { FacilityInfo } from "@/types";

interface KidsForestVisitInfoSectionProps {
  facility: FacilityInfo;
}

type VisitInfoItem = {
  label: string;
  value?: string;
  description: string;
  icon: typeof CalendarDays;
  tone: string;
  href?: string;
};

function findDetailValue(facility: FacilityInfo, label: string): string | undefined {
  return facility.detailSections
    ?.flatMap((section) => section.items)
    .find((item) => item.label === label)
    ?.value.trim();
}

function formatYear(value?: string): string | undefined {
  const year = value?.match(/\d{4}/)?.[0];
  return year ? `${year}년 조성` : value;
}

function InfoCard({ item }: { item: VisitInfoItem }) {
  const Icon = item.icon;
  const content = (
    <div className="flex min-h-[112px] gap-4 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-colors hover:border-forest-100">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-tertiary">{item.label}</p>
        <p className="mt-1 break-words text-base font-bold leading-6 text-text-primary">
          {item.value}
        </p>
        <p className="mt-2 text-xs leading-5 text-text-secondary">{item.description}</p>
      </div>
    </div>
  );

  if (!item.href) return content;

  return (
    <a href={item.href} className="block cursor-pointer" aria-label={`${item.label} ${item.value}`}>
      {content}
    </a>
  );
}

export function KidsForestVisitInfoSection({ facility }: KidsForestVisitInfoSectionProps) {
  const program = facility.educationPrograms?.[0];
  const operatingPeriod =
    facility.operatingHours ?? program?.period ?? findDetailValue(facility, "운영기간");
  const participationMethod =
    program?.participationMethod ?? findDetailValue(facility, "참여방법");
  const operationStatus = findDetailValue(facility, "운영현황") ?? "운영";
  const createdYear = formatYear(findDetailValue(facility, "조성연도"));

  const items: VisitInfoItem[] = [
    {
      label: "운영기간",
      value: operatingPeriod,
      description: "산림청 유아숲체험원 현황 API에서 제공한 운영기간입니다.",
      icon: CalendarDays,
      tone: "bg-sky/10 text-sky",
    },
    {
      label: "참여방법",
      value: participationMethod,
      description: "세부 접수 일정은 방문 전 전화로 확인하는 것이 안전합니다.",
      icon: ClipboardList,
      tone: "bg-forest-50 text-forest-700",
    },
    {
      label: "문의",
      value: facility.tel,
      description: "전화번호가 제공된 시설은 바로 문의할 수 있습니다.",
      icon: Phone,
      tone: "bg-amber/10 text-amber",
      href: facility.tel ? `tel:${facility.tel}` : undefined,
    },
    {
      label: "운영현황",
      value: operationStatus,
      description: "SHP/DBF 원천에서 운영으로 확인된 시설만 지도에 표시합니다.",
      icon: CheckCircle2,
      tone: "bg-emerald-500/10 text-emerald-700",
    },
    {
      label: "조성정보",
      value: createdYear,
      description: "유아숲체험원 UTM-K SHP/DBF 원천의 조성연도입니다.",
      icon: MapPin,
      tone: "bg-indigo-500/10 text-indigo-600",
    },
  ].filter((item) => item.value);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <InfoCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
