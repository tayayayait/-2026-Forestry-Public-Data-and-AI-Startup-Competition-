import { useEffect } from 'react'
// import forestBg from './assets/forest-bg.png' // Removed: using public webp instead

export default function App() {
  // Intersection Observer for Scroll Reveal animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Grain Texture */}
      <div className="grain"></div>

      {/* Animated Image Background (Replaces Video) */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center opacity-60 animate-slowPan"
          style={{ backgroundImage: `url('/배경영상.webp')` }}
        />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
        {/* Radial gradient for readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      </div>

      {/* Main Content Wrapper */}
      <main className="relative z-10 w-full flex flex-col">

        {/* ==============================================
             1. HERO SECTION
             ============================================== */}
        <section className="min-h-screen p-4 lg:p-6 flex flex-col lg:flex-row gap-6 w-full max-w-[100rem] mx-auto">
          
          {/* LEFT PANEL */}
          <div className="w-full lg:w-[52%] relative flex flex-col liquid-glass-strong rounded-[2.5rem] p-6 lg:p-12 overflow-hidden reveal">
            
            {/* Header */}
            <header className="flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <iconify-icon icon="solar:leaf-bold" className="text-black text-lg"></iconify-icon>
                </div>
                <span className="font-semibold text-2xl tracking-tighter text-white">Forest AI</span>
              </div>
              <button className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center hover-scale">
                <iconify-icon icon="solar:hamburger-menu-linear" className="text-xl text-white"></iconify-icon>
              </button>
            </header>

            {/* Center Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 z-20">
              <div className="w-20 h-20 rounded-[2rem] liquid-glass flex items-center justify-center mb-8 animate-float">
                <iconify-icon icon="solar:magic-stick-3-bold-duotone" className="text-4xl text-white/90"></iconify-icon>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.05em] text-white leading-tight break-keep-all mb-8 max-w-[15ch]">
                산림 데이터의 <br />
                <span className="font-serif italic text-white/80 font-light tracking-normal pr-2">새로운 융합</span>, <br />
                창업경진대회
              </h1>

              <button className="liquid-glass-strong group rounded-full pl-6 pr-2 py-2 flex items-center gap-4 hover-scale mb-12">
                <span className="text-lg font-medium text-white group-hover:text-white/90 supa-transition">참가 신청하기</span>
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 supa-transition">
                  <iconify-icon icon="solar:arrow-right-linear" className="text-xl text-white group-hover:translate-x-1 supa-transition"></iconify-icon>
                </div>
              </button>

              <div className="flex flex-wrap justify-center gap-3">
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs text-white/80 tracking-wide">공공데이터</span>
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs text-white/80 tracking-wide">인공지능(AI)</span>
                <span className="liquid-glass rounded-full px-5 py-2.5 text-xs text-white/80 tracking-wide">혁신 아이디어</span>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="mt-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full border-t border-white/10 pt-6 z-20">
              <span className="text-xs tracking-[0.2em] uppercase text-white/50 font-medium whitespace-nowrap">미래 산림 비전</span>
              <p className="text-sm md:text-base text-white/80 break-keep-all text-center">
                "자연과 AI가 만나 <span className="font-serif italic text-white">한계가 없는</span> 가치를 창출합니다."
              </p>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <div className="w-8 h-[1px] bg-white/20"></div>
                <span className="text-xs tracking-widest uppercase text-white/60">FOREST SERVICE</span>
                <div className="w-8 h-[1px] bg-white/20"></div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (Hidden on Mobile) */}
          <div className="hidden lg:flex w-[48%] flex-col gap-6 relative">
            
            {/* Top Bar */}
            <div className="flex justify-end gap-4 reveal" style={{ transitionDelay: '100ms' }}>
              <div className="liquid-glass rounded-full px-4 py-2 flex items-center gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-white supa-transition"><iconify-icon icon="solar:hashtag-linear"></iconify-icon></a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-white supa-transition"><iconify-icon icon="solar:link-minimalistic-bold"></iconify-icon></a>
              </div>
            </div>

            {/* Floating Community Card */}
            <div className="self-end mt-12 w-64 liquid-glass rounded-3xl p-6 hover-scale cursor-pointer reveal" style={{ transitionDelay: '200ms' }}>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <iconify-icon icon="solar:users-group-rounded-linear" className="text-xl text-white"></iconify-icon>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">대회 안내서</h3>
              <p className="text-sm text-white/60 leading-relaxed break-keep-all">대회 일정, 지원 자격, 수상 혜택 등 모든 정보를 한곳에서 확인하세요.</p>
            </div>

            {/* Bottom Features Grid */}
            <div className="mt-auto liquid-glass rounded-[2.5rem] p-4 flex flex-col gap-4 reveal" style={{ transitionDelay: '300ms' }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="liquid-glass rounded-3xl p-6 hover-scale group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 supa-transition">
                    <iconify-icon icon="solar:database-linear" className="text-xl text-white"></iconify-icon>
                  </div>
                  <h4 className="text-base font-semibold text-white">데이터 셋 제공</h4>
                </div>
                <div className="liquid-glass rounded-3xl p-6 hover-scale group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 supa-transition">
                    <iconify-icon icon="solar:cpu-bolt-linear" className="text-xl text-white"></iconify-icon>
                  </div>
                  <h4 className="text-base font-semibold text-white">AI 인프라 지원</h4>
                </div>
              </div>
              
              <div className="liquid-glass rounded-3xl p-6 flex items-center justify-between hover-scale group cursor-pointer">
                <div className="flex items-center gap-5">
                  <img src="https://images.unsplash.com/photo-1507120410856-1f35574c3b45?auto=format&fit=crop&w=150&q=80" alt="Plant" className="w-16 h-16 rounded-2xl object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 supa-transition" />
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">멘토링 프로그램</h4>
                    <p className="text-sm text-white/60">분야별 전문가의 맞춤형 컨설팅</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 group-hover:bg-white group-hover:text-black supa-transition">
                  <iconify-icon icon="solar:add-linear" className="text-xl"></iconify-icon>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
