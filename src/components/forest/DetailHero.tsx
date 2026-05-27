import * as React from "react";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

interface DetailHeroProps {
  images: string[];
  /** 히어로에 표시할 대표 이미지만 전달 (없으면 images 사용) */
  heroImages?: string[];
  facilityName: string;
  /** 사진 탭으로 스크롤하는 콜백 */
  onShowMorePhotos?: () => void;
}

/**
 * 상세 페이지 히어로 이미지 캐러셀.
 * CSS scroll-snap 기반으로 외부 라이브러리 없이 구현합니다.
 */
export function DetailHero({
  images,
  heroImages,
  facilityName,
  onShowMorePhotos,
}: DetailHeroProps) {
  // heroImages가 있으면 우선 사용, 없으면 전체 images에서 최대 4장
  const displayImages = React.useMemo(() => {
    if (heroImages && heroImages.length > 0) return heroImages;
    return images.slice(0, 4);
  }, [images, heroImages]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [errorUrls, setErrorUrls] = React.useState<Set<string>>(new Set());

  const handleError = React.useCallback((url: string) => {
    setErrorUrls((prev) => new Set(prev).add(url));
  }, []);

  const hasImages = displayImages.length > 0;

  const handleScroll = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    setActiveIndex(index);
  }, []);

  const scrollTo = React.useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.offsetWidth, behavior: "smooth" });
  }, []);

  if (!hasImages) {
    return (
      <div className="relative h-[220px] w-full overflow-hidden rounded-b-3xl bg-gradient-to-br from-forest-700 via-forest-500 to-forest-300 lg:h-[320px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
          <ImageOff className="size-12 opacity-60" aria-hidden />
          <p className="text-lg font-bold">{facilityName}</p>
          <p className="text-sm opacity-70">대표 이미지가 없습니다</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-[240px] w-full overflow-hidden rounded-b-3xl bg-gray-200 lg:h-[340px]">
      {/* 이미지 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto"
        onScroll={handleScroll}
      >
        {displayImages.map((url, index) => (
          <div key={`${url}-${index}`} className="h-full w-full shrink-0 snap-center">
            {errorUrls.has(url) ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-200/50 text-gray-400">
                <ImageOff className="size-8 opacity-60" aria-hidden />
                <span className="text-sm font-medium opacity-80">이미지 로드 실패</span>
              </div>
            ) : (
              <img
                src={url}
                alt={`${facilityName} 사진 ${index + 1}`}
                className="h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                onError={() => handleError(url)}
              />
            )}
          </div>
        ))}
      </div>

      {/* 그라데이션 오버레이 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* 이전/다음 버튼 (2장 이상일 때) */}
      {displayImages.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
            aria-label="이전 이미지"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            onClick={() => scrollTo(Math.min(displayImages.length - 1, activeIndex + 1))}
            aria-label="다음 이미지"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* 이미지 인디케이터 */}
      <div className="absolute bottom-6 right-4 z-10 flex items-center">
        {displayImages.length > 1 && (
          <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
            {activeIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>
    </div>
  );
}
