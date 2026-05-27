import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CloudSun,
  Flame,
  HeartPulse,
  MessageSquare,
  Sparkles,
  UserRound,
  Wind,
} from "lucide-react";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useFacilities } from "@/hooks/useFacilities";
import { getPm10Status, getUvStatus, useWeather } from "@/hooks/useWeather";
import { getCommunityHotIssues } from "@/lib/community-hot-issues";
import { buildDataDrivenCuration } from "@/lib/data-curation";
import type { CurationItem } from "@/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";

export const Route = createFileRoute("/home")({
  component: ServiceHomePage,
});

function ServiceHomePage() {
  const { data: weather, isError: isWeatherError, isLoading: isWeatherLoading } = useWeather();
  const { data: facilities, isLoading: isLoadingFacilities } = useFacilities();
  const posts = useAppStore((state) => state.posts);

  const curationItems = React.useMemo(() => {
    if (!facilities) return [];
    return buildDataDrivenCuration({ facilities }).slice(0, 4);
  }, [facilities]);

  const hotIssues = React.useMemo(() => getCommunityHotIssues(posts, 3), [posts]);

  return (
    <div className="flex min-h-full w-full flex-col bg-[#f7f8f3] pb-6 text-slate-950">
      <section className="rounded-b-[28px] bg-white px-4 pb-5 pt-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[23px] font-black leading-[1.34] tracking-tight text-slate-950">
              안녕하세요,
              <br />
              오늘 산림 치유 어떠세요?
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              현재 위치 기반의 맞춤 환경 정보를 확인하세요.
            </p>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#d8f8dd] text-forest-700">
            <UserRound className="size-7" aria-hidden />
          </div>
        </div>

        <EnvironmentPanel weather={weather} isError={isWeatherError} isLoading={isWeatherLoading} />
      </section>

      <section className="px-4 pt-6">
        <Link
          to="/curation"
          className="group block min-h-[128px] overflow-hidden rounded-[22px] bg-[linear-gradient(155deg,#69d7b0_0%,#04b997_52%,#007a59_100%)] p-5 text-white shadow-[0_18px_34px_rgba(16,185,129,0.18)]"
        >
          <div className="flex h-full min-h-[88px] flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur-md">
                <Sparkles className="size-3.5" aria-hidden />
                AI 맞춤 코스 찾기
              </span>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/18 transition-transform group-hover:translate-x-1">
                <ChevronRight className="size-5" aria-hidden />
              </span>
            </div>
            <h2 className="mt-8 text-[21px] font-black leading-tight">
              나의 건강 상태에 맞는
              <br />
              최적의 숲을 처방받으세요
            </h2>
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-4 gap-2 px-4 pt-4" aria-label="빠른 탐색">
        <QuickLink
          to="/map"
          imgSrc="/images/quick-links/map_search.png"
          label="지도 탐색"
        />
        <QuickLink
          to="/kids-map"
          imgSrc="/images/quick-links/kids_forest.png"
          label="아이 숲체험"
          ariaLabel="아이들과 함께하는 숲체험"
        />
        <QuickLink
          to="/plants"
          imgSrc="/images/quick-links/plant_encyclopedia.png"
          label="식물 도감"
        />
        <QuickLink
          to="/curation"
          imgSrc="/images/quick-links/theme_search.png"
          label="테마탐색"
        />
      </section>

      <section className="px-4 pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              이번 주말, 힐링 명소
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              데이터 분석 기반 추천 테마 코스
            </p>
          </div>
          <Link
            to="/map"
            search={{ curation: null, filter: null, region: null, q: null }}
            className="rounded-full bg-forest-50 px-4 py-2 text-xs font-black text-forest-700 transition-colors hover:bg-forest-100"
          >
            전체보기
          </Link>
        </div>

        <CurationCarousel items={curationItems} isLoading={isLoadingFacilities} />
      </section>

      <section className="px-4 pt-7">
        <div className="rounded-[22px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame className="size-5 fill-rose-500 text-rose-500" aria-hidden />
              <h2 className="text-lg font-black tracking-tight text-slate-950">커뮤니티 핫이슈</h2>
            </div>
            <Link
              to="/community"
              className="text-xs font-black text-slate-400 transition-colors hover:text-forest-700"
            >
              더보기
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {hotIssues.map((post, index) => (
              <Link
                key={post.id}
                to="/community"
                className="block rounded-[16px] border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:bg-white"
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
                    HOT
                  </span>
                  <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-800">
                  {post.content}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-400">
                  <span className="truncate">
                    {post.author} · {post.location}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden />
                    {post.comments}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function EnvironmentPanel({
  weather,
  isError,
  isLoading,
}: {
  weather: ReturnType<typeof useWeather>["data"];
  isError: boolean;
  isLoading: boolean;
}) {
  if (isError && !weather) {
    return (
      <div className="mt-5 flex min-h-[72px] items-center justify-center rounded-[20px] border border-slate-100 bg-slate-50 text-sm font-bold text-rose-500">
        환경 정보를 불러오지 못했습니다.
      </div>
    );
  }

  if (isLoading || !weather) {
    return (
      <div
        className="mt-5 grid min-h-[72px] grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-3"
        aria-busy="true"
        aria-label="환경 정보 로딩 중"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div className="flex min-w-0 flex-col justify-center gap-2.5 pl-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const pm10Status = getPm10Status(weather.pm10);
  const uvStatus = getUvStatus(weather.uvIndex);

  return (
    <div className="mt-5 grid min-h-[72px] grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <CloudSun className="size-9 shrink-0 text-sky-500" strokeWidth={1.7} aria-hidden />
        <div>
          <p className="text-xs font-bold text-slate-500">{weather.locationName || "현재 위치"}</p>
          <p className="mt-0.5 text-[22px] font-black leading-none text-slate-950">
            {weather.temperature}°C
          </p>
        </div>
      </div>
      <div className="h-10 w-px bg-slate-200" />
      <div className="flex min-w-0 flex-col justify-center gap-2 pl-4">
        <div className="flex items-center gap-2 text-xs">
          <Wind className={cn("size-4", pm10Status.color)} aria-hidden />
          <span className="whitespace-nowrap text-slate-600">
            미세먼지 <strong className={pm10Status.textClass}>{pm10Status.text}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <HeartPulse className={cn("size-4", uvStatus.color)} aria-hidden />
          <span className="whitespace-nowrap text-slate-600">
            자외선 <strong className={uvStatus.textClass}>{uvStatus.text}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  imgSrc,
  label,
  ariaLabel,
}: {
  to: "/map" | "/kids-map" | "/plants" | "/curation";
  imgSrc: string;
  label: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel ?? label}
      className="group flex min-h-[105px] flex-col items-center justify-center rounded-[18px] border border-slate-100 bg-white px-1 py-3 text-center shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md active:translate-y-0"
    >
      <div className="flex size-14 shrink-0 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
        <img src={imgSrc} alt="" className="size-full object-contain drop-shadow-sm" aria-hidden />
      </div>
      <span className="mt-2 text-[12px] font-black leading-tight text-slate-900">{label}</span>
    </Link>
  );
}

function CurationCarousel({ items, isLoading }: { items: CurationItem[]; isLoading: boolean }) {
  const skeletons = Array.from({ length: 4 });

  return (
    <Carousel
      opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
      className="mt-5 cursor-grab active:cursor-grabbing"
      aria-label="이번 주말, 힐링 명소"
    >
      <CarouselContent className="-ml-3">
        {isLoading
          ? skeletons.map((_, index) => (
              <CarouselItem key={index} className="basis-[54%] pl-3">
                <div className="h-[148px] rounded-[18px] bg-slate-100" />
              </CarouselItem>
            ))
          : items.map((item) => (
              <CarouselItem key={item.id} className="basis-[54%] pl-3">
                <CurationCard item={item} />
              </CarouselItem>
            ))}
      </CarouselContent>
    </Carousel>
  );
}

function CurationCard({ item }: { item: CurationItem }) {
  return (
    <Link
      to="/map"
      search={{ curation: item.id, filter: null, region: null, q: null }}
      aria-label={`${item.title} - ${item.location}`}
      className="group block overflow-hidden rounded-[18px] bg-white shadow-sm"
    >
      <div className="relative h-[148px] overflow-hidden bg-slate-200">
        <img
          src={`/images/curation/${item.id}.png`}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span
          className={cn(
            "absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-black text-forest-900 shadow-sm",
            item.accentColor,
          )}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
}
