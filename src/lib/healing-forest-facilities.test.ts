import { describe, expect, it } from "vitest";

import {
  getStaticHealingForestFacilities,
  mergeHealingForestStatusWithCoordinates,
} from "./healing-forest-facilities";
import type { HealingForestList } from "@/types";

const STALE_BISEULSAN_HOMEPAGE = "http://www.dssiseol.or.kr/gil/pages/course/page.html?mc=0148";
const CURRENT_BISEULSAN_HOMEPAGE = "https://yeyak.dssiseol.or.kr/index.do?menu_id=00004765";

const healingForestList: HealingForestList = {
  page: 1,
  perPage: 2,
  totalCount: 2,
  currentCount: 2,
  matchCount: 2,
  items: [
    {
      serialNumber: 1,
      region: "경기도",
      facilityName: "산음 치유의 숲",
      address: "경기도 양평군 단월면 고북길 347",
      telephoneNumber: "031-774-7687",
      homepage: "https://cafe.naver.com/saneumhealing",
      participationMethod: "전화/홈페이지",
      operator: "국립",
    },
    {
      serialNumber: 999,
      region: "테스트",
      facilityName: "좌표 없는 시설",
      address: "테스트 주소",
    },
  ],
};

describe("mergeHealingForestStatusWithCoordinates", () => {
  it("merges odcloud healing forest status with local shapefile coordinates", () => {
    const facilities = mergeHealingForestStatusWithCoordinates(healingForestList);

    expect(facilities).toHaveLength(1);
    expect(facilities[0]).toMatchObject({
      id: "healing-forest-1",
      name: "산음 치유의 숲",
      type: "healing_forest",
      address: "경기도 양평군 단월면 고북길 347",
      lat: 37.60455927717994,
      lng: 127.5784207834287,
      tel: "031-774-7687",
      homepage: "https://cafe.naver.com/saneumhealing",
    });
  });

  it("normalizes stale Biseulsan homepage values from live status data", () => {
    const biseulsan = getStaticHealingForestFacilities().find(
      (facility) => facility.id === "healing-forest-32",
    );
    expect(biseulsan).toBeDefined();

    const facilities = mergeHealingForestStatusWithCoordinates({
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
      items: [
        {
          serialNumber: 32,
          region: "",
          facilityName: biseulsan!.name,
          address: biseulsan!.address,
          homepage: STALE_BISEULSAN_HOMEPAGE,
        },
      ],
    });

    expect(facilities).toHaveLength(1);
    expect(facilities[0].homepage).toBe(CURRENT_BISEULSAN_HOMEPAGE);
  });
});

describe("getStaticHealingForestFacilities", () => {
  it("returns all 38 shapefile coordinate records as map-ready facilities", () => {
    const facilities = getStaticHealingForestFacilities();

    expect(facilities).toHaveLength(38);
    expect(facilities.map((facility) => facility.name)).toContain("서귀포 치유의 숲");
    expect(facilities.every((facility) => facility.type === "healing_forest")).toBe(true);
    expect(facilities.every((facility) => Number.isFinite(facility.lat))).toBe(true);
    expect(facilities.every((facility) => Number.isFinite(facility.lng))).toBe(true);
  });

  it("uses the current official Biseulsan healing forest page", () => {
    const facility = getStaticHealingForestFacilities().find(
      (item) => item.id === "healing-forest-32",
    );

    expect(facility?.homepage).toBe(CURRENT_BISEULSAN_HOMEPAGE);
  });

  it("keeps the official Mangyeongdaesan healing program period separate from the recreation forest API row", () => {
    const facility = getStaticHealingForestFacilities().find(
      (item) => item.id === "healing-forest-8",
    );

    expect(facility).toMatchObject({
      name: "망경대산 치유의 숲",
      tel: "033-375-8600",
      operatingHours: "4월~11월",
    });
  });
});
