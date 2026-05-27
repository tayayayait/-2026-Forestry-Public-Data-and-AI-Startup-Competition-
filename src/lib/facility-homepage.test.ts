import { describe, expect, it } from "vitest";

import {
  CURRENT_BISEULSAN_HEALING_FOREST_HOMEPAGE,
  normalizeFacilityHomepages,
  normalizeHomepageUrl,
} from "./facility-homepage";
import type { FacilityInfo } from "@/types";

const baseFacility: FacilityInfo = {
  id: "test-facility",
  name: "Test Facility",
  type: "arboretum",
  address: "Test Address",
  lat: 37,
  lng: 127,
  programs: [],
  trails: [],
  educationPrograms: [],
  accessibility: {
    wheelchair: false,
    stroller: false,
    parking: false,
    restroom: false,
    elevator: false,
    helpdog: false,
  },
};

describe("normalizeHomepageUrl", () => {
  it("normalizes known stale public-data homepage URLs", () => {
    expect(
      normalizeHomepageUrl("http://www.dssiseol.or.kr/gil/pages/course/page.html?mc=0148"),
    ).toBe(CURRENT_BISEULSAN_HEALING_FOREST_HOMEPAGE);
    expect(normalizeHomepageUrl("https://www.hygn.go.kr/04097/04112/04161.web")).toBe(
      "https://www.hygn.go.kr/02147/02178.web",
    );
    expect(
      normalizeHomepageUrl(
        "http://forest.go.kr/newkfsweb/html/HtmlPage.do?pg=/foreston/fon_arboretum/foreston_0301_18.html&orgId=fon&mn=KFS_01_03_01",
      ),
    ).toBe("https://www.yesan.go.kr/arbor/index.do");
  });

  it("leaves unknown homepage URLs unchanged", () => {
    expect(normalizeHomepageUrl("https://example.com/current")).toBe("https://example.com/current");
  });
});

describe("normalizeFacilityHomepages", () => {
  it("normalizes both facility homepage and homepage detail values", () => {
    const staleUrl = "http://www.morningcalm.co.kr/html/main.php";
    const [facility] = normalizeFacilityHomepages([
      {
        ...baseFacility,
        homepage: staleUrl,
        detailSections: [
          {
            title: "운영 정보",
            items: [{ label: "홈페이지", value: staleUrl }],
          },
        ],
      },
    ]);

    expect(facility.homepage).toBe("https://www.morningcalm.co.kr/");
    expect(facility.detailSections?.[0]?.items[0]?.value).toBe("https://www.morningcalm.co.kr/");
  });
});
