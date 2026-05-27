import type { FacilityInfo } from "@/types";

export const CURRENT_BISEULSAN_HEALING_FOREST_HOMEPAGE =
  "https://yeyak.dssiseol.or.kr/index.do?menu_id=00004765";

// 산림청 공공데이터의 오래된/만료된 홈페이지 URL → 현재 실제 URL 매핑.
// 키는 반드시 소문자로 작성 (normalizeHomepageUrl 에서 .toLowerCase() 후 매칭).
const HOMEPAGE_URL_OVERRIDES = new Map<string, string>([
  // ── 기존 오버라이드 ──
  [
    "http://www.dssiseol.or.kr/gil/pages/course/page.html?mc=0148",
    CURRENT_BISEULSAN_HEALING_FOREST_HOMEPAGE,
  ],
  [
    "https://www.dssiseol.or.kr/gil/pages/course/page.html?mc=0148",
    CURRENT_BISEULSAN_HEALING_FOREST_HOMEPAGE,
  ],
  ["https://www.hygn.go.kr/04097/04112/04161.web", "https://www.hygn.go.kr/02147/02178.web"],
  [
    "http://www.forest.go.kr/newkfsweb/kfs/idx/subindex.do?orgid=kna&mn=kfs_15",
    "https://kna.forest.go.kr/",
  ],
  [
    "http://forest.go.kr/newkfsweb/html/htmlpage.do?pg=/foreston/fon_arboretum/foreston_0301_18.html&orgid=fon&mn=kfs_01_03_01",
    "https://www.yesan.go.kr/arbor/index.do",
  ],
  [
    "http://ecopark.bucheon.go.kr/site/main/index091",
    "https://reserv.bucheon.go.kr/site/main/see/detail?program_seq=1392",
  ],
  ["http://www.morningcalm.co.kr/html/main.php", "https://www.morningcalm.co.kr/"],
  ["http://arbor.snu.ac.kr/snu/index.asp", "https://arbor.snu.ac.kr/"],
  [
    "http://www.sandulsori.co.kr/main/main.asp",
    "http://www.sandulsori.co.kr/default/01/menu01.php",
  ],

  // ── 2026-05 전수 조사 추가분 (DNS 실패/404/500/SSL/타임아웃) ──
  // 한국자생식물원: 국립전환 후 도메인 변경
  ["http://www.kbotanic.co.kr/", "https://www.koagi.or.kr/"],
  // 인천수목원: 인천의 공원 통합 페이지로 이관
  ["http://arboretum.incheon.go.kr/index.do", "https://www.incheon.go.kr/park/park0101"],
  // 석모도수목원: 강화군 통합 홈페이지로 이관
  ["http://sukmodo.ganghwa.go.kr/open_content/", "https://sukmodo.ganghwa.go.kr/"],
  // 경기도농업기술원(잣향기푸른숲 등): 경기도산림환경연구소로 이관
  ["http://farm.gg.go.kr/sigt/74", "https://forest.gg.go.kr/"],
  // 충북 미동산수목원: 충북도청 산하 새 도메인으로 이관
  [
    "http://forest.chungbuk.go.kr/home/sub.do?menu_key=54",
    "https://midongsan.chungbuk.go.kr/midongsan/index.do",
  ],
  // 금강수목원: 2025년 6월 운영 종료, 숲나들e로 대체
  ["https://www.keumkang.go.kr:452/arboretum.asp?location=001", "https://www.foresttrip.go.kr/"],
  // 영인산수목원: 숲나들e에서 정보 제공
  ["http://arboretum.younginsan.co.kr/arboretum/index.html", "https://www.foresttrip.go.kr/"],
  // 대아수목원: 전북 산림환경연구원으로 이관
  ["http://www.daeagarden.kr/main/main.action", "https://forest.jb.go.kr/daeagarden"],
  // 완도수목원: 전남도청 관광 페이지로 이관
  ["http://www.wando-arboretum.go.kr/2011/main.html", "https://www.wando.go.kr/tour"],
  // 경북수목원: 경북도청 통합 페이지로 이관
  [
    "http://arboretum.gb.go.kr/front/",
    "https://www.gb.go.kr/Main/open_contents/section/arboretum/index.do",
  ],
  // 경남수목원: 경남도청 통합 페이지로 이관
  ["http://tree.gyeongnam.go.kr/03tree/01.jsp", "https://www.gyeongnam.go.kr/tree/index.gyeong"],
  // 경남 산림환경연구소 수목원 (greencamp)
  [
    "http://greencamp.gyeongnam.go.kr/jsp/main/main.jsp",
    "https://www.gyeongnam.go.kr/tree/index.gyeong",
  ],
  // 솔향수목원: URL은 동일하나 http→https 이관
  ["http://www.gn.go.kr/solhyang/index.do", "https://www.gn.go.kr/solhyang/"],
  // 원광대 자연식물원: 대학교 도메인 변경
  ["http://botanicalgarden.wonkwang.ac.kr/", "https://botanicalgarden.wku.ac.kr/"],
  // 갤러리가든: 도메인 소멸, 대체 사이트 없음 → 숲나들e
  ["http://gallerygarden.theione.kr/", "https://www.foresttrip.go.kr/"],
  // 자굴산수목원: 도메인 소멸 → 숲나들e
  ["http://jagulsan.com/web/main/", "https://www.foresttrip.go.kr/"],
  // 너무니모수목원: 도메인 소멸 → 숲나들e
  ["http://www.nemunimo.co.kr/home/main.html", "https://www.foresttrip.go.kr/"],
]);

/**
 * 공공데이터에서 가져온 홈페이지 URL을 정규화합니다.
 * - 오래된/만료된 URL을 현재 URL로 교체
 * - http → https 프로토콜 업그레이드
 */
export function normalizeHomepageUrl(homepage: string | undefined): string | undefined {
  const value = homepage?.trim();
  if (!value) return undefined;

  const lowered = value.toLowerCase();

  // 1) 알려진 오버라이드가 있으면 적용
  const override = HOMEPAGE_URL_OVERRIDES.get(lowered);
  if (override) return override;

  return value;
}

/**
 * 시설명으로 네이버 검색 URL을 생성합니다.
 * 홈페이지가 접속 불가 시 대안으로 사용합니다.
 */
export function buildHomepageSearchFallbackUrl(facilityName: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${facilityName} 공식 홈페이지`)}`;
}

export function normalizeFacilityHomepages(facilities: FacilityInfo[]): FacilityInfo[] {
  return facilities.map((facility) => {
    const homepage = normalizeHomepageUrl(facility.homepage);

    return {
      ...facility,
      homepage,
      detailSections: facility.detailSections?.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          value: normalizeHomepageUrl(item.value) ?? item.value,
        })),
      })),
    };
  });
}
