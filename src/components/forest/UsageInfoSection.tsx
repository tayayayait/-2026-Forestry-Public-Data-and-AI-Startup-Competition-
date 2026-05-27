import * as React from "react";
import { CalendarOff, Clock, Headphones, ParkingCircle, Wallet } from "lucide-react";
import type { FacilityFullDetail, WaypointInfo } from "@/types";
import { WaypointCard } from "./WaypointCard";
import { CourseTipSection } from "./CourseTipSection";

interface UsageInfoSectionProps {
  usageInfo?: FacilityFullDetail["usageInfo"];
  parkingInfo?: string;
  waypoints?: WaypointInfo[];
  tips?: string[];
  courseDistance?: string;
  courseTime?: string;
  courseTheme?: string;
}

function sanitizeHtml(html?: string): string {
  if (!html) return "";
  return html
    // 1. 특수문자(Entity)를 먼저 원래 기호로 되돌립니다.
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    // 2. 이제 실제 꺽쇠가 된 <br> 계열 태그를 줄바꿈(\n)으로 바꿉니다.
    .replace(/<br\s*\/?>/gi, "\n")
    // 3. 남은 모든 HTML 태그를 지웁니다.
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function formatBracketedSchedule(text: string): string {
  const matches = [...text.matchAll(/\[([^\]]+)\]\s*([^\[]+)/g)];
  if (matches.length === 0) return text;

  return matches
    .map((match) => `${match[1]?.trim()} ${match[2]?.trim()}`.trim())
    .filter(Boolean)
    .join("\n");
}

export function formatUsageText(text: string): string {
  if (!text) return "";
  let formatted = text;

  // 패턴 1: 시간(00:00) 뒤에 붙어있는 하이픈(-) 또는 쉼표(,) 분리
  formatted = formatted.replace(/(\d{2}:\d{2})\s*[-,\,]\s*(?=[가-힣0-9]+)/g, "$1\n- ");
  
  // 패턴 2: 쉼표(,) 뒤에 "월~" 또는 특정 키워드가 올 때 줄바꿈
  formatted = formatted.replace(/,\s*(?=\d+월)/g, "\n- ");

  // 패턴 3: 이미 줄바꿈 없이 길게 이어지는 경우, '※' 기호 앞에서 줄바꿈
  formatted = formatted.replace(/\s*(※)/g, "\n$1");

  return formatted;
}

interface InfoRowProps {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  content: string;
  prominent?: boolean;
}

function InfoRow({ icon, bgColor, title, content, prominent = false }: InfoRowProps) {
  if (!content) return null;

  return (
    <div
      className={`flex rounded-2xl border border-border-subtle bg-white ${
        prominent ? "flex-row gap-4 p-5" : "flex-col gap-3 p-5"
      }`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1 w-full">
        <h4 className={`font-bold text-text-primary ${prominent ? "text-[15px]" : "text-sm"}`}>
          {title}
        </h4>
        <div
          className={`mt-1.5 flex flex-col gap-1 ${
            prominent ? "text-[15px] leading-relaxed" : "text-sm leading-relaxed"
          }`}
        >
          {content.split("\n").map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;
            
            const isSubItem = trimmedLine.startsWith("-");
            const cleanLine = isSubItem ? trimmedLine.substring(1).trim() : trimmedLine;
            
            return (
              <div 
                key={index} 
                className={`flex gap-1.5 ${
                  !isSubItem && index !== 0 ? "mt-1.5" : ""
                } ${isSubItem ? "text-gray-500 pl-1.5" : "text-text-secondary"}`}
              >
                {isSubItem && <span className="text-gray-400 shrink-0 select-none">•</span>}
                <span className="break-keep">{cleanLine}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function UsageInfoSection({
  usageInfo,
  parkingInfo,
  waypoints,
  tips,
  courseDistance,
  courseTime,
  courseTheme,
}: UsageInfoSectionProps) {
  const useTime = formatUsageText(formatBracketedSchedule(sanitizeHtml(usageInfo?.useTime)));
  const useFee = formatUsageText(sanitizeHtml(usageInfo?.useFee));
  const restDate = formatUsageText(sanitizeHtml(usageInfo?.restDate));
  const infoCenter = formatUsageText(sanitizeHtml(usageInfo?.infoCenter));
  const parking = formatUsageText(sanitizeHtml(parkingInfo));

  const hasUsageData = useTime || useFee || restDate || infoCenter || parking;
  const hasWaypoints = waypoints && waypoints.length > 0;
  const hasTips = tips && tips.length > 0;

  return (
    <div className="space-y-8">
      {hasUsageData && (
        <div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <h4 className="text-base font-bold text-text-primary">이용 정보</h4>
            <p className="text-xs text-text-tertiary font-medium">※ 공공데이터 기준이며 실제 운영 정보와 다를 수 있습니다.</p>
          </div>
          <div className="space-y-3">
            <InfoRow
              icon={<Clock className="size-5 text-sky" aria-hidden />}
              bgColor="bg-sky/10"
              title="이용 시간"
              content={useTime}
              prominent
            />
            <InfoRow
              icon={<Wallet className="size-5 text-emerald-600" aria-hidden />}
              bgColor="bg-emerald-500/10"
              title="이용 요금"
              content={useFee}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                icon={<CalendarOff className="size-5 text-coral" aria-hidden />}
                bgColor="bg-coral/10"
                title="쉬는 날"
                content={restDate}
              />
              <InfoRow
                icon={<ParkingCircle className="size-5 text-indigo-500" aria-hidden />}
                bgColor="bg-indigo-500/10"
                title="주차 안내"
                content={parking}
              />
              <InfoRow
                icon={<Headphones className="size-5 text-amber" aria-hidden />}
                bgColor="bg-amber/10"
                title="문의처"
                content={infoCenter}
              />
            </div>
          </div>
        </div>
      )}

      {hasWaypoints && (
        <div>
          <h4 className="mb-4 text-base font-bold text-text-primary">코스 경유지</h4>
          {(courseDistance || courseTime || courseTheme) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {courseDistance && (
                <span className="rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                  거리: {courseDistance}
                </span>
              )}
              {courseTime && (
                <span className="rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                  소요: {courseTime}
                </span>
              )}
              {courseTheme && (
                <span className="rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                  테마: {courseTheme}
                </span>
              )}
            </div>
          )}
          <div className="space-y-0">
            {waypoints.map((wp, index, arr) => (
              <WaypointCard key={wp.order} waypoint={wp} isLast={index === arr.length - 1} />
            ))}
          </div>
        </div>
      )}

      {hasTips && (
        <div>
          <h4 className="mb-4 text-base font-bold text-text-primary">이용 팁 & 주의사항</h4>
          <CourseTipSection tips={tips} />
        </div>
      )}

      {!hasUsageData && !hasWaypoints && !hasTips && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
          <p className="font-medium text-gray-500">이용 안내 정보가 준비 중입니다</p>
          <p className="mt-1 text-sm text-gray-400">
            공공데이터가 업데이트되면 자동으로 반영됩니다
          </p>
        </div>
      )}
    </div>
  );
}
