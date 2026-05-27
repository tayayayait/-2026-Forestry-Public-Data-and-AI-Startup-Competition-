import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import type { CurationId } from "@/types";
import { getCurationMapFilter } from "@/lib/curation-map-filters";

export const Route = createFileRoute("/curation")({
  component: CurationPage,
});

type CurationCardData = {
  id: CurationId;
  catchphrase: string;
  title: string;
  imageSrc: string;
};

const CURATION_LIST: CurationCardData[] = [
  {
    id: "meditation-healing",
    catchphrase: "마음을 비우는 시간",
    title: "명상·치유 추천 코스",
    imageSrc: "/images/curation/meditation-healing.png",
  },

  {
    id: "forest-camping",
    catchphrase: "숲속에서 하룻밤",
    title: "캠핑·야영 추천 코스",
    imageSrc: "/images/curation/forest-camping.png",
  },
  {
    id: "family-outing",
    catchphrase: "가족과 함께하는 주말",
    title: "가족 나들이 추천 코스",
    imageSrc: "/images/curation/family-outing.png",
  },
  {
    id: "registered-healing-forest",
    catchphrase: "산림청이 인증한",
    title: "치유의숲 추천 코스",
    imageSrc: "/images/curation/registered-healing-forest.png",
  },
  {
    id: "lodging-recreation-forest",
    catchphrase: "숲속 힐링 숙소",
    title: "숙박 가능 휴양림",
    imageSrc: "/images/curation/lodging-recreation-forest.png",
  },
  {
    id: "activity-recreation-forest",
    catchphrase: "체험·산책·탐방",
    title: "활동형 휴양림 추천 코스",
    imageSrc: "/images/curation/activity-recreation-forest.png",
  },
  {
    id: "small-capacity-recreation-forest",
    catchphrase: "한적한 자연 속으로",
    title: "소규모 휴양림 추천 코스",
    imageSrc: "/images/curation/small-capacity-recreation-forest.png",
  },
];

function getCurrentSeasonCurationId(): "seasonal-spring" | "seasonal-summer" | "seasonal-autumn" | "seasonal-winter" {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const month = kstTime.getUTCMonth() + 1;

  if (month >= 3 && month <= 5) return "seasonal-spring";
  if (month >= 6 && month <= 8) return "seasonal-summer";
  if (month >= 9 && month <= 11) return "seasonal-autumn";
  return "seasonal-winter";
}

const SEASONAL_CURATION_MAP: Record<string, Omit<CurationCardData, "id">> = {
  "seasonal-spring": {
    catchphrase: "여의도 안가도 괜찮아요!",
    title: "봄꽃 구경 추천 코스",
    imageSrc: "/images/curation/cherry-blossom.png", // 기존 봄꽃 이미지 재활용
  },
  "seasonal-summer": {
    catchphrase: "더위를 피해서",
    title: "여름 계곡/숲길 추천 코스",
    imageSrc: "/images/curation/seasonal-summer.png",
  },
  "seasonal-autumn": {
    catchphrase: "가을빛 물든 숲",
    title: "단풍 명소 추천 코스",
    imageSrc: "/images/curation/seasonal-autumn.png",
  },
  "seasonal-winter": {
    catchphrase: "눈 덮인 겨울산",
    title: "겨울 설경 추천 코스",
    imageSrc: "/images/curation/seasonal-winter.png",
  },
};

function CurationPage() {
  const router = useRouter();

  const currentSeasonId = React.useMemo(() => getCurrentSeasonCurationId(), []);
  const seasonalCard: CurationCardData = {
    id: currentSeasonId,
    ...SEASONAL_CURATION_MAP[currentSeasonId],
  };

  const finalCurationList = [seasonalCard, ...CURATION_LIST];

  return (
    <div className="min-h-screen bg-warm-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white/80 px-4 backdrop-blur-xl border-b border-black/5 lg:h-16 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.history.back()}
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5 text-forest-900" aria-hidden />
          </button>
          <h1 className="text-lg font-bold text-forest-900">테마 큐레이션</h1>
        </div>
        <Link
          to="/"
          className="flex size-10 items-center justify-center rounded-full bg-forest-50 text-forest-700 transition-colors hover:bg-forest-100"
        >
          <Home className="size-5" aria-hidden />
        </Link>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[600px] px-4 pt-6">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-forest-600">오늘등산이 PICK한</p>
          <h2 className="text-2xl font-bold tracking-tight text-forest-900 lg:text-3xl">
            추천 코스를 확인하세요!
          </h2>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          {finalCurationList.map((curation) => (
            <CurationCard key={curation.id} data={curation} />
          ))}
        </div>

        {/* 전체보기 버튼 (지도 이동) */}
        <div className="mt-10 flex justify-center pb-8">
          <Link
            to="/map"
            search={{ curation: null, filter: null, region: null, q: null }}
            className="group flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 font-bold text-forest-900 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all hover:scale-105"
          >
            <MapIcon className="size-5 text-forest-600" />
            <span>산 전체보기</span>
            <ArrowRight className="size-4 text-forest-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function CurationCard({ data }: { data: CurationCardData }) {
  const curationFilter = getCurationMapFilter(data.id);

  return (
    <Link
      to="/map"
      search={{ curation: data.id, filter: null, region: null, q: null }}
      className="group relative flex min-h-[196px] w-full overflow-hidden rounded-2xl bg-forest-100 transition-all hover:scale-[1.02] active:scale-[0.98] lg:min-h-[220px]"
    >
      <img
        src={data.imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      {/* 텍스트 가독성을 위한 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      <div className="relative z-10 flex h-full flex-col justify-end p-5 lg:p-6">
        <p className="mb-1 text-xs font-semibold text-white/90 lg:text-sm">{data.catchphrase}</p>
        <h3 className="mb-1 text-xl font-bold text-white lg:text-2xl">{data.title}</h3>
        <div className="mt-3 space-y-1.5">
          <p className="line-clamp-2 text-[11px] font-medium leading-4 text-white/85 lg:text-xs">
            <span className="font-extrabold text-white">추천 기준</span>{" "}
            {curationFilter?.reason}
          </p>
          <p className="line-clamp-1 text-[10px] font-medium leading-4 text-white/70 lg:text-[11px]">
            <span className="font-extrabold text-white/90">근거 데이터</span>{" "}
            {curationFilter?.basis}
          </p>
        </div>
      </div>
    </Link>
  );
}

function MapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="21" />
      <line x1="15" x2="15" y1="3" y2="21" />
    </svg>
  );
}
