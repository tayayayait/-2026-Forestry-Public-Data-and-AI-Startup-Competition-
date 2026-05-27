import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Box,
  Camera,
  Hash,
  Leaf,
  Link as LinkIcon,
  Map,
  Menu,
  Plus,
  Sparkles,
  TreePine,
  Trees,
  Users,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: ForestLandingPage,
});

const homeBackgroundWebpSrc =
  "/%ED%99%88%ED%99%94%EB%A9%B4%20%EB%B0%B0%EA%B2%BD%EC%98%81%EC%83%81%2016%EC%B4%88.webp";

const landingStyles = `
  :root {
    --supa-ease: cubic-bezier(0.16, 1, 0.3, 1);
  }
  .supa-transition {
    transition: all 0.5s var(--supa-ease);
  }
  .hover-scale {
    transition: transform 0.4s var(--supa-ease);
  }
  .hover-scale:hover {
    transform: scale(1.03);
  }
  .hover-scale:active {
    transform: scale(0.97);
  }
  .reveal {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
  .liquid-glass {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: none;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    position: relative;
  }
  .liquid-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .liquid-glass-strong {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: none;
    box-shadow: 4px 4px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.15);
    position: relative;
  }
  .liquid-glass-strong::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .grain {
    position: absolute;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) }
    50% { transform: translateY(-15px) }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes marquee {
    0% { transform: translateX(0%) }
    100% { transform: translateX(-100%) }
  }
  .animate-marquee {
    animation: marquee 30s linear infinite;
  }
  .mask-image-linear-edges {
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  }
`;

const marqueeItems = [
  { name: "산림청", icon: <TreePine className="size-6" /> },
  { name: "한국임업진흥원", icon: <Trees className="size-6" /> },
  { name: "한국산림복지진흥원", icon: <Leaf className="size-6" /> },
  { name: "한국수목원정원관리원", icon: <Sparkles className="size-6" /> },
  { name: "한국등산·트레킹지원센터", icon: <Map className="size-6" /> },
];

function ForestLandingPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-black text-white selection:bg-white/20 selection:text-white font-sans">
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      {/* Public Forest Data AI | 숲이 필요한 순간 | 바로 찾는 산림 치유 | 식물 도감 보기 */}

      {/* Grain Texture */}
      <div className="grain"></div>

      {/* Background WebP */}
      <div className="absolute inset-0 z-0 bg-black fixed">
        <img
          src={homeBackgroundWebpSrc}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        <section className="flex min-h-screen w-full max-w-[100rem] mx-auto flex-col gap-6 p-4 lg:flex-row lg:p-6 shrink-0">
          {/* LEFT PANEL (52%) */}
          <div className="reveal liquid-glass-strong relative flex w-full flex-col overflow-hidden rounded-[2.5rem] p-6 lg:w-[52%] lg:p-12">
            {/* Header */}
            <header className="z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-white">
                  <Leaf className="size-4 text-black" aria-hidden />
                </div>
                <span className="text-2xl font-semibold tracking-tighter text-white">
                  숲 테라피 AI
                </span>
              </div>
              <button className="liquid-glass hover-scale flex size-12 items-center justify-center rounded-full">
                <Menu className="size-5 text-white" aria-hidden />
              </button>
            </header>

            {/* Center Content */}
            <div className="z-20 flex flex-1 flex-col items-center justify-center py-16 text-center">
              <span className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                Public Forest Data AI
              </span>
              <div className="liquid-glass animate-float mb-8 flex size-20 items-center justify-center rounded-[2rem]">
                <Wand2 className="size-10 text-white/90" aria-hidden />
              </div>

              <h1 className="mb-8 max-w-[15ch] break-keep text-4xl font-semibold leading-tight tracking-[-0.05em] text-white md:text-5xl lg:text-6xl">
                산림 치유의 <br />
                <span className="pr-2 font-serif font-light italic tracking-normal text-white/80">
                  새로운 경험
                </span>
                , <br />숲 테라피 AI
              </h1>

              <Link
                to="/home"
                className="liquid-glass-strong hover-scale supa-transition group mb-12 flex items-center gap-4 rounded-full py-2 pl-6 pr-2"
              >
                <span className="supa-transition text-lg font-medium text-white group-hover:text-white/90">
                  지금 탐험하기
                </span>
                <div className="supa-transition flex size-10 items-center justify-center rounded-full bg-white/15 group-hover:bg-white/25">
                  <ArrowRight
                    className="supa-transition size-5 text-white group-hover:translate-x-1"
                    aria-hidden
                  />
                </div>
              </Link>
              <Link
                to="/plants"
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 underline underline-offset-4"
              >
                <BookOpen className="size-4" aria-hidden />
                식물 아카이브 보기
              </Link>

              <div className="flex flex-wrap justify-center gap-3">
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs tracking-wide text-white/80">
                  데이터 프로세싱
                </span>
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs tracking-wide text-white/80">
                  환경정보 분석
                </span>
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs tracking-wide text-white/80">
                  맞춤 숲 처방
                </span>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="z-20 mt-auto flex w-full flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 md:flex-row">
              <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                비저너리 데이터
              </span>
              <p className="break-keep text-center text-sm text-white/80 md:text-base">
                "우리는 <span className="font-serif italic text-white">데이터가 이끄는</span> 새로운
                치유를 상상했습니다."
              </p>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <div className="h-[1px] w-8 bg-white/20"></div>
                <span className="text-xs uppercase tracking-widest text-white/60">FOREST DATA</span>
                <div className="h-[1px] w-8 bg-white/20"></div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (48% - Hidden on Mobile) */}
          <div className="relative hidden w-[48%] flex-col gap-6 lg:flex">
            {/* Top Bar */}
            <div className="reveal flex justify-end gap-4">
              <div className="liquid-glass flex items-center gap-4 rounded-full px-4 py-2">
                <a
                  href="#"
                  className="supa-transition flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Hash className="size-4" />
                </a>
                <a
                  href="#"
                  className="supa-transition flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <LinkIcon className="size-4" />
                </a>
                <a
                  href="#"
                  className="supa-transition flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Camera className="size-4" />
                </a>
              </div>
              <button className="liquid-glass hover-scale flex size-12 items-center justify-center rounded-full">
                <Sparkles className="size-5 text-white" />
              </button>
            </div>

            {/* Floating Community Card */}
            <div className="reveal hover-scale liquid-glass mt-12 w-64 cursor-pointer self-end rounded-3xl p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-white/10">
                <Users className="size-5 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">생태계 진입하기</h3>
              <p className="break-keep text-sm leading-relaxed text-white/60">
                수많은 사용자와 함께 숲 테라피의 미래를 경험하고 공유하세요.
              </p>
            </div>

            {/* Bottom Features Grid */}
            <div className="reveal liquid-glass mt-auto flex flex-col gap-4 rounded-[2.5rem] p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="liquid-glass hover-scale group cursor-pointer rounded-3xl p-6">
                  <div className="supa-transition mb-4 flex size-10 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20">
                    <Wand2 className="size-5 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white">데이터 프로세싱</h4>
                </div>
                <div className="liquid-glass hover-scale group cursor-pointer rounded-3xl p-6">
                  <div className="supa-transition mb-4 flex size-10 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20">
                    <BookOpen className="size-5 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white">식물 아카이브</h4>
                </div>
              </div>

              <div className="liquid-glass hover-scale group flex cursor-pointer items-center justify-between rounded-3xl p-6">
                <div className="flex items-center gap-5">
                  <img
                    src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=150&q=80"
                    alt="Plant"
                    className="supa-transition size-16 rounded-2xl object-cover opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                  />
                  <div>
                    <h4 className="mb-1 text-lg font-semibold text-white">고급 코스 큐레이션</h4>
                    <p className="text-sm text-white/60">AI 기반 맞춤형 환경 분석 알고리즘</p>
                  </div>
                </div>
                <div className="supa-transition flex size-10 items-center justify-center rounded-full border border-white/20 text-white/60 group-hover:bg-white group-hover:text-black">
                  <Plus className="size-5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE SECTION */}
        <section className="reveal relative overflow-hidden border-y border-white/5 bg-black/20 py-12 backdrop-blur-sm shrink-0 mt-8 mb-20">
          <div className="mx-auto flex max-w-[100rem] items-center gap-12 px-6">
            <p className="hidden shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-white/50 md:block">
              Trusted ecosystem
            </p>
            <div className="mask-image-linear-edges relative flex flex-1 overflow-hidden">
              <div className="animate-marquee flex whitespace-nowrap items-center gap-16 md:gap-24 opacity-80">
                {marqueeItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-white/80">{item.icon}</span>
                    <span className="text-2xl font-bold tracking-tighter">{item.name}</span>
                  </div>
                ))}
                {/* Duplicate for infinite loop illusion */}
                {marqueeItems.map((item, idx) => (
                  <div key={"dup-" + idx} className="flex items-center gap-3">
                    <span className="text-white/80">{item.icon}</span>
                    <span className="text-2xl font-bold tracking-tighter">{item.name}</span>
                  </div>
                ))}
                {marqueeItems.map((item, idx) => (
                  <div key={"dup2-" + idx} className="flex items-center gap-3">
                    <span className="text-white/80">{item.icon}</span>
                    <span className="text-2xl font-bold tracking-tighter">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
