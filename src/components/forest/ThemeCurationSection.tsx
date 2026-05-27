import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  type LucideIcon,
  Tent,
  Flower2,
  Footprints,
  Heart,
  Home,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";

import type { CurationId } from "@/types";

type ThemeCard = {
  id: CurationId;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  accentBorder: string;
};

const THEME_CARDS: ThemeCard[] = [
  {
    id: "meditation-healing",
    icon: Heart,
    title: "명상·치유",
    subtitle: "마음을 비우는 시간",
    gradient: "from-purple-500/25 to-fuchsia-500/10",
    accentBorder: "border-purple-400/30",
  },
  {
    id: "forest-camping",
    icon: Tent,
    title: "캠핑·야영",
    subtitle: "숲속에서 하룻밤",
    gradient: "from-blue-500/25 to-cyan-500/10",
    accentBorder: "border-blue-400/30",
  },
  {
    id: "beginner-trail",
    icon: Footprints,
    title: "초보 산책이",
    subtitle: "완만한 숲길 코스",
    gradient: "from-emerald-500/25 to-green-500/10",
    accentBorder: "border-emerald-400/30",
  },
  {
    id: "cherry-blossom",
    icon: Flower2,
    title: "봄꽃 구경",
    subtitle: "여의도 안가도 괜찮아요",
    gradient: "from-pink-500/25 to-rose-500/10",
    accentBorder: "border-pink-400/30",
  },
  {
    id: "family-outing",
    icon: Users,
    title: "가족 나들이",
    subtitle: "아이 동반 추천 코스",
    gradient: "from-amber-500/25 to-yellow-500/10",
    accentBorder: "border-amber-400/30",
  },
  {
    id: "registered-healing-forest",
    icon: TreePine,
    title: "치유의숲",
    subtitle: "산림청 등록 시설",
    gradient: "from-teal-500/25 to-emerald-500/10",
    accentBorder: "border-teal-400/30",
  },
  {
    id: "lodging-recreation-forest",
    icon: Home,
    title: "숙박 가능",
    subtitle: "숲속 힐링 숙소",
    gradient: "from-indigo-500/25 to-violet-500/10",
    accentBorder: "border-indigo-400/30",
  },
  {
    id: "activity-recreation-forest",
    icon: Sparkles,
    title: "활동형 휴양림",
    subtitle: "체험·산책·탐방",
    gradient: "from-orange-500/25 to-red-500/10",
    accentBorder: "border-orange-400/30",
  },
  {
    id: "small-capacity-recreation-forest",
    icon: TreePine,
    title: "소규모 휴양림",
    subtitle: "한적한 자연 속으로",
    gradient: "from-lime-500/25 to-green-500/10",
    accentBorder: "border-lime-400/30",
  },
];

export function ThemeCurationSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <section className="mx-auto w-full max-w-[100rem] px-4 py-20 lg:px-6 lg:py-28">
      <div className="landing-reveal mb-12">
        <span className="landing-glass mb-6 inline-flex rounded-full px-4 py-2 text-xs font-semibold text-white/70">
          THEME CURATION
        </span>
        <h2 className="landing-word-keep mb-4 text-3xl font-bold leading-tight [letter-spacing:0] md:text-4xl lg:text-5xl">
          테마별로 찾는{" "}
          <span className="font-serif font-light italic text-white/70">나만의 숲 코스</span>
        </h2>
        <p className="landing-word-keep max-w-2xl text-base leading-7 text-white/55 lg:text-lg">
          산림 공공데이터 실제 출력 필드 기반으로 큐레이션된 테마입니다. 원하는 테마를 선택하면
          조건에 맞는 시설을 지도에서 바로 탐색할 수 있습니다.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="landing-reveal -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide lg:-mx-6 lg:gap-5 lg:px-6"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {THEME_CARDS.map((card, index) => (
          <ThemeCardItem key={card.id} card={card} delay={index * 60} />
        ))}
      </div>
    </section>
  );
}

function ThemeCardItem({ card, delay }: { card: ThemeCard; delay: number }) {
  return (
    <Link
      to="/map"
      search={{ curation: card.id, filter: null, region: null, q: null }}
      className={`group relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border ${card.accentBorder} bg-gradient-to-br ${card.gradient} backdrop-blur-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_40px_rgba(255,255,255,0.08)] lg:w-[260px]`}
      style={{ scrollSnapAlign: "start", transitionDelay: `${delay}ms` }}
    >
      {/* 장식 원 */}
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/[0.04] transition-transform duration-500 group-hover:scale-125" />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        {/* 아이콘 */}
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white/80 transition-colors group-hover:bg-white/15 group-hover:text-white">
          <card.icon className="size-6" aria-hidden />
        </div>

        {/* 텍스트 */}
        <h3 className="mb-1.5 text-lg font-bold text-white">{card.title}</h3>
        <p className="mb-6 text-sm leading-5 text-white/50">{card.subtitle}</p>

        {/* 하단 CTA */}
        <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-white/60 transition-colors group-hover:text-white/90">
          <span>시설 탐색</span>
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
