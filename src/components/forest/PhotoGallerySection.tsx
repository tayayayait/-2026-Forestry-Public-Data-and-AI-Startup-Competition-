import * as React from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import type { CategorizedImage, FacilityType, PhotoCategory, PhotoGalleryData } from "@/types";
import { getCategoryMeta, getActiveCategories } from "@/lib/photo-category-descriptions";

/* ── 타입 ── */

interface ImageDetail {
  url: string;
  caption?: string;
}

interface PhotoGallerySectionProps {
  images: string[];
  imageDetails?: ImageDetail[];
  /** 구조화된 사진 갤러리 (신규) */
  photoGallery?: PhotoGalleryData;
  /** 시설 유형 (카테고리 설명 생성에 사용) */
  facilityType?: FacilityType;
}

const PHOTO_CATEGORIES: PhotoCategory[] = ["scenery", "facility", "experience", "etc"];

function normalizePhotoUrl(url: string | null | undefined): string | null {
  const normalized = typeof url === "string" ? url.trim() : "";
  return normalized.length > 0 ? normalized : null;
}

function uniqueRenderableImages(
  images: CategorizedImage[],
  failedUrls: ReadonlySet<string>,
): CategorizedImage[] {
  const seen = new Set<string>();

  return images.flatMap((image) => {
    const url = normalizePhotoUrl(image.url);
    if (!url || failedUrls.has(url) || seen.has(url)) return [];

    seen.add(url);
    return [{ ...image, url }];
  });
}

export function getRenderablePhotoGallery(
  photoGallery: PhotoGalleryData,
  failedUrls: ReadonlySet<string> = new Set(),
): PhotoGalleryData {
  const categoryImages = PHOTO_CATEGORIES.flatMap((category) => photoGallery[category]);
  const sourceImages = photoGallery.all.length > 0 ? photoGallery.all : categoryImages;
  const all = uniqueRenderableImages(sourceImages, failedUrls);

  return {
    scenery: all.filter((image) => image.category === "scenery"),
    facility: all.filter((image) => image.category === "facility"),
    experience: all.filter((image) => image.category === "experience"),
    etc: all.filter((image) => image.category === "etc"),
    all,
  };
}

/* ── 카테고리 필터 탭 ── */

type FilterTab = "all" | PhotoCategory;

interface CategoryTabProps {
  tab: FilterTab;
  label: string;
  icon?: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function CategoryTab({ tab, label, icon, count, isActive, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
        isActive
          ? "bg-forest-700 text-white shadow-sm"
          : "bg-gray-100 text-text-secondary hover:bg-gray-200"
      }`}
      aria-pressed={isActive}
      aria-label={`${label} 카테고리 (${count}장)`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {label}
      <span
        className={`ml-0.5 text-xs font-bold ${isActive ? "text-white/70" : "text-text-tertiary"}`}
      >
        {count}
      </span>
    </button>
  );
}

/* ── 벤토 레이아웃 ── */

interface BentoLayoutProps {
  images: CategorizedImage[];
  onImageClick: (globalIndex: number) => void;
  onImageError: (url: string) => void;
  /** 전체 갤러리에서의 시작 인덱스 (라이트박스용) */
  globalOffset: number;
}

function BentoLayout({ images, onImageClick, onImageError, globalOffset }: BentoLayoutProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="grid grid-cols-1 gap-1 overflow-hidden rounded-2xl">
        <ImageTile
          image={images[0]}
          className="aspect-[16/9]"
          onClick={() => onImageClick(globalOffset)}
          onImageError={onImageError}
        />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
        {images.map((img, idx) => (
          <ImageTile
            key={`${img.url}-${idx}`}
            image={img}
            className="aspect-[4/3]"
            onClick={() => onImageClick(globalOffset + idx)}
            onImageError={onImageError}
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-2xl h-64 sm:h-80">
        <ImageTile
          image={images[0]}
          className="col-span-2 row-span-2"
          onClick={() => onImageClick(globalOffset)}
          onImageError={onImageError}
        />
        <ImageTile
          image={images[1]}
          className="col-span-1 row-span-1"
          onClick={() => onImageClick(globalOffset + 1)}
          onImageError={onImageError}
        />
        <ImageTile
          image={images[2]}
          className="col-span-1 row-span-1"
          onClick={() => onImageClick(globalOffset + 2)}
          onImageError={onImageError}
        />
      </div>
    );
  }

  // 4장 이상: 벤토 상단(3장) + 하단 2열 그리드
  const topImages = images.slice(0, 3);
  const bottomImages = images.slice(3);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-t-2xl h-64 sm:h-80">
        <ImageTile
          image={topImages[0]}
          className="col-span-2 row-span-2"
          onClick={() => onImageClick(globalOffset)}
          onImageError={onImageError}
        />
        <ImageTile
          image={topImages[1]}
          className="col-span-1 row-span-1"
          onClick={() => onImageClick(globalOffset + 1)}
          onImageError={onImageError}
        />
        <ImageTile
          image={topImages[2]}
          className="col-span-1 row-span-1"
          onClick={() => onImageClick(globalOffset + 2)}
          onImageError={onImageError}
        />
      </div>
      <div
        className={`grid gap-1 overflow-hidden rounded-b-2xl ${
          bottomImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {bottomImages.map((img, idx) => (
          <ImageTile
            key={`${img.url}-${idx}`}
            image={img}
            className="aspect-[4/3]"
            onClick={() => onImageClick(globalOffset + 3 + idx)}
            onImageError={onImageError}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 이미지 타일 (캡션 오버레이 포함) ── */

interface ImageTileProps {
  image: CategorizedImage;
  className?: string;
  onClick: () => void;
  onImageError: (url: string) => void;
}

function ImageTile({ image, className = "", onClick, onImageError }: ImageTileProps) {
  const imageUrl = normalizePhotoUrl(image.url);

  if (!imageUrl) return null;

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest-700 focus:ring-offset-1 ${className}`}
      aria-label={image.caption || "사진 보기"}
    >
      <img
        src={imageUrl}
        alt={image.caption || "사진"}
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => onImageError(imageUrl)}
      />
      {/* 호버 시 확대 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
        <Maximize2 className="size-6 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-80 drop-shadow-md" />
      </div>
      {/* 캡션 오버레이 */}
      {image.caption && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-3 transition-transform duration-300 group-hover:translate-y-0">
          <p className="text-xs font-medium text-white/90 line-clamp-2 drop-shadow-sm">
            {image.caption}
          </p>
        </div>
      )}
    </button>
  );
}

/* ── 카테고리 섹션 ── */

interface CategorySectionProps {
  category: PhotoCategory;
  images: CategorizedImage[];
  facilityType: FacilityType;
  onImageClick: (globalIndex: number) => void;
  onImageError: (url: string) => void;
  globalOffset: number;
}

function CategorySection({
  category,
  images,
  facilityType,
  onImageClick,
  onImageError,
  globalOffset,
}: CategorySectionProps) {
  const meta = getCategoryMeta(facilityType, category);

  return (
    <div className="space-y-3">
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-base">{meta.icon}</span>
        <div>
          <h4 className="text-sm font-bold text-text-primary">
            {meta.label}
            <span className="ml-1.5 text-xs font-medium text-text-tertiary">{images.length}장</span>
          </h4>
          <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{meta.description}</p>
        </div>
      </div>

      {/* 벤토 레이아웃 */}
      <BentoLayout
        images={images}
        onImageClick={onImageClick}
        onImageError={onImageError}
        globalOffset={globalOffset}
      />
    </div>
  );
}

/* ── 라이트박스 ── */

interface LightboxProps {
  images: CategorizedImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onImageError: (url: string) => void;
  facilityType: FacilityType;
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onImageError,
  facilityType,
}: LightboxProps) {
  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  const meta = getCategoryMeta(facilityType, currentImage.category);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="사진 확대 보기"
    >
      {/* 닫기 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        aria-label="닫기"
      >
        <X className="size-6" />
      </button>

      {/* 이전 */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="이전 사진"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* 이미지 + 정보 */}
      <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={currentImage.url}
          alt={currentImage.caption || `사진 ${currentIndex + 1}`}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          referrerPolicy="no-referrer"
          onError={() => onImageError(currentImage.url)}
        />
        {/* 하단 정보 */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 카테고리 배지 */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
              {meta.icon} {meta.label}
            </span>
            {/* 캡션 */}
            {currentImage.caption && (
              <span className="text-sm text-white/70">{currentImage.caption}</span>
            )}
          </div>
          {/* 인디케이터 */}
          <span className="text-xs text-white/50">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* 다음 */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="다음 사진"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */

export function PhotoGallerySection({
  images,
  imageDetails,
  photoGallery,
  facilityType = "recreation_forest",
}: PhotoGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");
  const [failedImageUrls, setFailedImageUrls] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // photoGallery가 없으면 기존 이미지를 폴백으로 변환
  const gallery: PhotoGalleryData = React.useMemo(() => {
    if (
      photoGallery &&
      (photoGallery.all.length > 0 ||
        PHOTO_CATEGORIES.some((category) => photoGallery[category].length > 0))
    ) {
      return getRenderablePhotoGallery(photoGallery, failedImageUrls);
    }

    // 기존 이미지를 CategorizedImage[]로 변환 (하위 호환성)
    const fallback: CategorizedImage[] =
      imageDetails && imageDetails.length > 0
        ? imageDetails.map((d) => ({
            url: d.url,
            caption: d.caption,
            category: "etc" as PhotoCategory,
            source: "tourapi" as const,
          }))
        : images.map((url) => ({
            url,
            category: "etc" as PhotoCategory,
            source: "tourapi" as const,
          }));

    return getRenderablePhotoGallery(
      {
        scenery: [],
        facility: [],
        experience: [],
        etc: fallback,
        all: fallback,
      },
      failedImageUrls,
    );
  }, [photoGallery, images, imageDetails, failedImageUrls]);

  React.useEffect(() => {
    setFailedImageUrls(new Set());
  }, [photoGallery, images, imageDetails]);

  // 활성 카테고리 목록
  const activeCategories = React.useMemo(
    () =>
      getActiveCategories({
        scenery: gallery.scenery.length,
        facility: gallery.facility.length,
        experience: gallery.experience.length,
        etc: gallery.etc.length,
      }),
    [gallery],
  );

  // 카테고리별 표시 여부
  const hasCategories = activeCategories.length > 0;
  const showCategoryView = hasCategories && activeCategories.some((cat) => cat !== "etc");

  // 현재 필터에 따른 이미지 목록
  const displayImages = React.useMemo((): CategorizedImage[] => {
    if (activeFilter === "all") return gallery.all;
    return gallery[activeFilter];
  }, [gallery, activeFilter]);

  // 글로벌 인덱스를 라이트박스 이미지 배열의 인덱스로 매핑
  const lightboxImages = gallery.all;

  const handleImageError = React.useCallback((url: string) => {
    const failedUrl = normalizePhotoUrl(url);
    if (!failedUrl) return;

    setFailedImageUrls((current) => {
      if (current.has(failedUrl)) return current;

      const next = new Set(current);
      next.add(failedUrl);
      return next;
    });
  }, []);

  const openLightbox = (globalIndex: number) => setLightboxIndex(globalIndex);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : lightboxImages.length - 1);
    }
  };
  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex < lightboxImages.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  // 키보드 이벤트
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  // 빈 상태
  if (gallery.all.length === 0) {
    return (
      <div className="hidden">
        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 mb-3"></div>
        <p className="font-medium text-gray-500">등록된 사진이 없습니다</p>
        <p className="mt-1 text-sm text-gray-400">사진이 등록되면 자동으로 표시됩니다</p>
      </div>
    );
  }

  // 카테고리 분류 없이 단순 갤러리 (etc만 있는 경우)
  if (!showCategoryView) {
    return (
      <>
        <p className="mb-3 text-sm font-semibold text-text-tertiary">총 {gallery.all.length}장</p>
        <BentoLayout
          images={gallery.all}
          onImageClick={openLightbox}
          onImageError={handleImageError}
          globalOffset={0}
        />
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={goPrev}
            onNext={goNext}
            onImageError={handleImageError}
            facilityType={facilityType}
          />
        )}
      </>
    );
  }

  // 카테고리별 구조화된 갤러리
  return (
    <>
      {/* 사진 수 + 카테고리 필터 탭 */}
      <div className="mb-4 space-y-3">
        <p className="text-sm font-semibold text-text-tertiary">총 {gallery.all.length}장</p>

        {/* 카테고리 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <CategoryTab
            tab="all"
            label="전체"
            count={gallery.all.length}
            isActive={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          />
          {activeCategories.map((cat) => {
            const meta = getCategoryMeta(facilityType, cat);
            return (
              <CategoryTab
                key={cat}
                tab={cat}
                label={meta.label.split(" · ")[0]}
                icon={meta.icon}
                count={gallery[cat].length}
                isActive={activeFilter === cat}
                onClick={() => setActiveFilter(cat)}
              />
            );
          })}
        </div>
      </div>

      {/* 필터가 "전체"이면 카테고리별 섹션으로 표시 */}
      {activeFilter === "all" ? (
        <div className="space-y-8">
          {activeCategories.map((cat) => {
            // 글로벌 인덱스 오프셋 계산
            const offset = gallery.all.findIndex((img) => img === gallery[cat][0]);
            return (
              <CategorySection
                key={cat}
                category={cat}
                images={gallery[cat]}
                facilityType={facilityType}
                onImageClick={openLightbox}
                onImageError={handleImageError}
                globalOffset={offset >= 0 ? offset : 0}
              />
            );
          })}
        </div>
      ) : (
        // 특정 카테고리 필터 선택 시
        <div className="space-y-3">
          {(() => {
            const meta = getCategoryMeta(facilityType, activeFilter as PhotoCategory);
            return (
              <div className="flex items-center gap-2">
                <span className="text-base">{meta.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{meta.label}</h4>
                  <p className="mt-0.5 text-xs text-text-secondary">{meta.description}</p>
                </div>
              </div>
            );
          })()}
          <BentoLayout
            images={displayImages}
            onImageClick={(idx) => {
              // 필터된 이미지의 글로벌 인덱스 찾기
              const img = displayImages[idx - 0]; // displayImages 내의 local index
              const globalIdx = gallery.all.indexOf(img);
              openLightbox(globalIdx >= 0 ? globalIdx : 0);
            }}
            onImageError={handleImageError}
            globalOffset={0}
          />
        </div>
      )}

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          onImageError={handleImageError}
          facilityType={facilityType}
        />
      )}
    </>
  );
}
