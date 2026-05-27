import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation2,
  Phone,
  Search,
  Timer,
  Ruler,
  Mountain,
} from "lucide-react";
import { useFacilities } from "@/hooks/useFacilities";
import { useFacilityDetail } from "@/hooks/useFacilityDetail";
import { useKidsForestFacilities } from "@/hooks/useKidsForestFacilities";
import type { FacilityDetailSection, FacilityInfo } from "@/types";
import { DetailHero } from "@/components/forest/DetailHero";
import { DetailTabs, type DetailTab, type TabId } from "@/components/forest/DetailTabs";
import { TransportInfo } from "@/components/forest/TransportInfo";
import { FacilityIntroSection } from "@/components/forest/FacilityIntroSection";
import { UsageInfoSection } from "@/components/forest/UsageInfoSection";
import { PhotoGallerySection } from "@/components/forest/PhotoGallerySection";
import { KidsForestVisitInfoSection } from "@/components/forest/KidsForestVisitInfoSection";
import { buildHomepageSearchFallbackUrl } from "@/lib/facility-homepage";
import { selectFacilityHeroImageUrls } from "@/lib/facility-hero-images";

export const Route = createFileRoute("/facilities/$facilityId")({
  component: FacilityDetailPage,
});

const FACILITY_LABELS: Record<FacilityInfo["type"], string> = {
  healing_forest: "치유의숲",
  kids_forest: "유아숲체험원",
  recreation_forest: "자연휴양림",
  traditional_village_forest: "전통마을숲",
  arboretum: "수목원",
  education: "산림교육",
};

const DETAIL_TAB_SCROLL_OFFSET = 96;
const DETAIL_TAB_ACTIVE_TOLERANCE = 4;
const DETAIL_SCROLL_CONTAINER_ID = "main-content";
const DETAIL_SOURCE_FIELD_MARKERS = [
  "page",
  "perPage",
  "rcrfrstNm",
  "stayngPosblYn",
  "OWNER_NM",
  "RCAR_NM",
] as const;

const KIDS_FOREST_DETAIL_TABS: DetailTab[] = [
  { id: "intro", label: "소개" },
  { id: "usage", label: "방문안내" },
  { id: "photos", label: "사진" },
  { id: "transport", label: "교통정보" },
];

function compactSections(facility: FacilityInfo): FacilityDetailSection[] {
  if (facility.detailSections?.length) return facility.detailSections;

  return [
    {
      title: "기본 정보",
      items: [
        { label: "주소", value: facility.address },
        ...(facility.tel ? [{ label: "전화번호", value: facility.tel }] : []),
        ...(facility.homepage ? [{ label: "홈페이지", value: facility.homepage }] : []),
      ],
    },
  ];
}

function buildNaverMapSearchUrl(facility: FacilityInfo): string {
  const query = encodeURIComponent(`${facility.name} ${facility.address}`.trim());
  return `https://map.naver.com/p/search/${query}`;
}

function getDetailScrollContainer(): HTMLElement | null {
  const container = document.getElementById(DETAIL_SCROLL_CONTAINER_ID);
  if (!container) return null;

  return container.scrollHeight > container.clientHeight + 1 ? container : null;
}

function getScrollTop(scrollContainer: HTMLElement | null): number {
  return scrollContainer?.scrollTop ?? window.scrollY;
}

function getScrollHeight(scrollContainer: HTMLElement | null): number {
  return scrollContainer?.scrollHeight ?? document.documentElement.scrollHeight;
}

function getViewportHeight(scrollContainer: HTMLElement | null): number {
  return scrollContainer?.clientHeight ?? window.innerHeight;
}

function getElementTop(element: HTMLElement, scrollContainer: HTMLElement | null): number {
  if (!scrollContainer) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  return (
    element.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top +
    scrollContainer.scrollTop
  );
}

function getActiveTabFromScroll(
  sectionRefs: Record<TabId, HTMLElement | null>,
  scrollPosition: number,
  scrollContainer: HTMLElement | null,
  isAtPageBottom = false,
): TabId {
  const visibleSections = (Object.entries(sectionRefs) as Array<[TabId, HTMLElement | null]>)
    .flatMap(([id, element]) =>
      element ? [{ id, top: getElementTop(element, scrollContainer) }] : [],
    )
    .sort((a, b) => a.top - b.top);

  if (isAtPageBottom) {
    return visibleSections.at(-1)?.id ?? "intro";
  }

  return (
    [...visibleSections]
      .reverse()
      .find((section) => scrollPosition + DETAIL_TAB_ACTIVE_TOLERANCE >= section.top)?.id ??
    visibleSections[0]?.id ??
    "intro"
  );
}

function FacilityDetailPage() {
  const { facilityId } = Route.useParams();
  const { data: facilities = [], isLoading: isFacilitiesLoading, isError, error } = useFacilities();
  const {
    data: kidsForestFacilities,
    isLoading: isKidsForestLoading,
    isError: isKidsForestError,
    error: kidsForestError,
  } = useKidsForestFacilities();

  const combinedFacilities = React.useMemo(
    () => [...facilities, ...(kidsForestFacilities?.items ?? [])],
    [facilities, kidsForestFacilities?.items],
  );

  const facility = React.useMemo(
    () => combinedFacilities.find((item) => item.id === facilityId),
    [combinedFacilities, facilityId],
  );
  const sections = React.useMemo(() => (facility ? compactSections(facility) : []), [facility]);

  // TourAPI 상세 정보 조회
  const { data: detail, isLoading: isDetailLoading } = useFacilityDetail(facility);

  const [activeTab, setActiveTab] = React.useState<TabId>("intro");
  const sectionRefs = React.useRef<Record<TabId, HTMLElement | null>>({
    intro: null,
    usage: null,
    photos: null,
    transport: null,
  });

  // 스크롤 추적
  React.useEffect(() => {
    const scrollContainer = getDetailScrollContainer();
    const scrollTarget = scrollContainer ?? window;

    const handleScroll = () => {
      const scrollTop = getScrollTop(scrollContainer);
      const isAtPageBottom =
        scrollTop + getViewportHeight(scrollContainer) >= getScrollHeight(scrollContainer) - 1;

      const nextActiveTab = getActiveTabFromScroll(
        sectionRefs.current,
        scrollTop + DETAIL_TAB_SCROLL_OFFSET,
        scrollContainer,
        isAtPageBottom,
      );

      React.startTransition(() => setActiveTab(nextActiveTab));
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const element = sectionRefs.current[tabId];
    if (element) {
      const scrollContainer = getDetailScrollContainer();
      const top = getElementTop(element, scrollContainer) - DETAIL_TAB_SCROLL_OFFSET;

      if (scrollContainer) {
        scrollContainer.scrollTo({ top, behavior: "smooth" });
      } else {
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const isLoading = isFacilitiesLoading || isKidsForestLoading || isDetailLoading;
  const loadError = isError ? error : isKidsForestError ? kidsForestError : null;
  const mapRoute = facility?.type === "kids_forest" ? "/kids-map" : "/map";
  const isKidsForest = facility?.type === "kids_forest";
  const introSections =
    isKidsForest && facility
      ? sections.filter((section) => section.title !== "유아숲체험원 안내")
      : sections;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Loader2 className="size-8 animate-spin text-forest-700" aria-hidden />
        <p className="mt-4 text-sm font-semibold text-text-secondary">
          상세 정보를 불러오는 중입니다...
        </p>
      </main>
    );
  }

  if (loadError || !facility) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <AlertTriangle className="size-8 text-coral" aria-hidden />
        <h1 className="mt-3 text-xl font-bold text-text-primary">시설 정보를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {loadError instanceof Error
            ? loadError.message
            : "데이터에 없는 시설이거나 현재 조회 가능한 상태가 아닙니다."}
        </p>
        <Link
          to={mapRoute}
          search={{ curation: null, filter: null, region: null, q: null }}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 text-sm font-bold text-white hover:bg-forest-800"
        >
          <ArrowLeft className="size-4" aria-hidden />
          지도로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-warm-bg pb-20">
      {/* 1. 히어로 이미지 */}
      <DetailHero
        images={detail?.images ?? []}
        heroImages={selectFacilityHeroImageUrls(facility.type, detail?.photoGallery)}
        facilityName={facility.name}
        onShowMorePhotos={() => handleTabChange("photos")}
      />

      <div className="mx-auto max-w-2xl">
        {/* 2. 시설 기본 정보 카드 */}
        <section className="relative z-10 -mt-6 rounded-t-3xl bg-white px-5 pt-8 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:px-8">
          <div className="flex items-center justify-between">
            <span className="inline-flex rounded-md bg-forest-50 px-2.5 py-1 text-xs font-bold text-forest-700">
              {FACILITY_LABELS[facility.type]}
            </span>
            <Link
              to={mapRoute}
              search={{ curation: null, filter: null, region: null, q: null }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-text-tertiary hover:text-text-secondary"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              목록으로
            </Link>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text-primary lg:text-3xl">
            {facility.name}
          </h1>

          <p className="mt-2 flex items-start gap-1.5 text-sm leading-6 text-text-secondary">
            <MapPin className="mt-1 size-3.5 shrink-0 text-forest-600" aria-hidden />
            {facility.address || "주소 정보 없음"}
          </p>

          {/* 코스 요약 정보 배지 */}
          <div className="mt-5 flex flex-wrap gap-2">
            {detail?.courseDistance && (
              <span className="flex items-center gap-1.5 rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                <Ruler className="size-3.5 text-forest-600" />
                {detail.courseDistance}
              </span>
            )}
            {detail?.courseTime && (
              <span className="flex items-center gap-1.5 rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                <Timer className="size-3.5 text-amber" />
                {detail.courseTime}
              </span>
            )}
            {detail?.courseTheme && (
              <span className="flex items-center gap-1.5 rounded-full border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-text-primary">
                <Mountain className="size-3.5 text-sky" />
                {detail.courseTheme}
              </span>
            )}
          </div>

          {/* 3. 액션 버튼 */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              href={buildNaverMapSearchUrl(facility)}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-700 px-3 text-sm font-bold text-white transition-colors hover:bg-forest-800 sm:col-span-1"
            >
              <Navigation2 className="size-4" aria-hidden />
              지도앱 열기
            </a>
            {facility.tel && (
              <a
                href={`tel:${facility.tel}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-default bg-white px-3 text-sm font-bold text-text-primary transition-colors hover:bg-forest-50"
              >
                <Phone className="size-4" aria-hidden />
                전화
              </a>
            )}
            {facility.homepage && (
              <a
                href={facility.homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-default bg-white px-3 text-sm font-bold text-text-primary transition-colors hover:bg-forest-50"
              >
                <ExternalLink className="size-4" aria-hidden />
                웹사이트
              </a>
            )}
            {facility.homepage && (
              <a
                href={buildHomepageSearchFallbackUrl(facility.name)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-default bg-white px-3 text-sm font-bold text-text-tertiary transition-colors hover:bg-forest-50"
                title="웹사이트 접속이 안 될 경우 검색으로 찾기"
              >
                <Search className="size-4" aria-hidden />
                검색
              </a>
            )}
          </div>
        </section>

        {/* 4. 탭 네비게이션 */}
        <DetailTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={isKidsForest ? KIDS_FOREST_DETAIL_TABS : undefined}
        />

        {/* 5. 탭 콘텐츠 영역 */}
        <div className="px-4 py-6 space-y-12 lg:px-8">
          {/* 소개 섹션 */}
          <section
            id="facility-section-intro"
            aria-labelledby="facility-tab-intro"
            ref={(el) => {
              sectionRefs.current.intro = el;
            }}
            className="scroll-mt-24 space-y-4"
          >
            <h3 className="text-lg font-bold text-text-primary">소개</h3>
            <FacilityIntroSection
              overview={detail?.overview}
              facility={facility}
              sections={introSections}
            />
          </section>

          {/* 이용안내 섹션 */}
          <section
            id="facility-section-usage"
            aria-labelledby="facility-tab-usage"
            ref={(el) => {
              sectionRefs.current.usage = el;
            }}
            className="scroll-mt-24 space-y-4"
          >
            <h3 className="text-lg font-bold text-text-primary">
              {isKidsForest ? "방문안내" : "이용안내"}
            </h3>
            {isKidsForest ? (
              <KidsForestVisitInfoSection facility={facility} />
            ) : (
              <UsageInfoSection
                usageInfo={detail?.usageInfo}
                parkingInfo={detail?.transport?.parking}
                waypoints={detail?.waypoints}
                tips={detail?.tips}
                courseDistance={detail?.courseDistance}
                courseTime={detail?.courseTime}
                courseTheme={detail?.courseTheme}
              />
            )}
          </section>



          {/* 사진 섹션 */}
          <section
            id="facility-section-photos"
            aria-labelledby="facility-tab-photos"
            ref={(el) => {
              sectionRefs.current.photos = el;
            }}
            className="scroll-mt-24 space-y-4"
          >
            <h3 className="text-lg font-bold text-text-primary">사진</h3>
            <PhotoGallerySection
              images={detail?.images ?? []}
              imageDetails={detail?.imageDetails}
              photoGallery={detail?.photoGallery}
              facilityType={facility.type}
            />
          </section>

          {/* 교통정보 섹션 */}
          <section
            id="facility-section-transport"
            aria-labelledby="facility-tab-transport"
            ref={(el) => {
              sectionRefs.current.transport = el;
            }}
            className="scroll-mt-24 space-y-4"
          >
            <h3 className="text-lg font-bold text-text-primary">교통 정보</h3>
            <TransportInfo
              transport={detail?.transport}
              facilityLocation={{ lat: facility.lat, lng: facility.lng, name: facility.name }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
