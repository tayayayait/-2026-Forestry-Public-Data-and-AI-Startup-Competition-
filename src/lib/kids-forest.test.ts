import { describe, expect, it } from "vitest";

import {
  buildOperationalKidsForestFacilitiesFromCoordinateSeeds,
  formatKidsForestOperatingPeriod,
  mergeKidsForestFacilities,
} from "./kids-forest";

describe("kids forest operational coordinate seeds", () => {
  it("builds the map list from operational SHP coordinate records only", () => {
    const result = buildOperationalKidsForestFacilitiesFromCoordinateSeeds({
      coordinateSeeds: [
        { name: "open", address: "addr-1", status: "운영", year: "2020", lat: 37, lng: 127 },
        { name: "unknown", address: "addr-2", status: "", year: "2020", lat: 38, lng: 128 },
        { name: "closed", address: "addr-3", status: "미운영", year: "2020", lat: 39, lng: 129 },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      name: "open",
      address: "addr-1",
      lat: 37,
      lng: 127,
    });
    expect(result.totalCount).toBe(3);
    expect(result.coordinateMatchedCount).toBe(1);
    expect(result.missingCoordinateCount).toBe(2);
  });

  it("enriches operational SHP records with ODCloud API visit fields", () => {
    const result = buildOperationalKidsForestFacilitiesFromCoordinateSeeds({
      coordinateSeeds: [
        {
          name: "샘플 유아숲체험원",
          address: "서울특별시 샘플구 숲길 1",
          status: "운영",
          year: "2020",
          lat: 37.5,
          lng: 127,
        },
      ],
      apiItems: [
        {
          시설명: "샘플 유아숲체험원",
          주소: "서울특별시 샘플구 숲길 1",
          운영기간: "2025-03~2025-11",
          전화번호: "02-000-0000",
          참여방법: "전화/방문/공문",
        },
      ],
    });

    expect(result.items[0]).toMatchObject({
      operatingHours: "3월~11월",
      tel: "02-000-0000",
      programs: ["유아숲체험", "전화/방문/공문"],
    });
    expect(result.items[0]?.detailSections?.[0]?.items).toContainEqual({
      label: "참여방법",
      value: "전화/방문/공문",
    });
  });
});

describe("kids forest operating period", () => {
  it("shows ODCloud year-month ranges as month-only operating ranges", () => {
    expect(formatKidsForestOperatingPeriod("2025-03~2025-11")).toBe("3월~11월");
    expect(formatKidsForestOperatingPeriod("2026.04~2026.11")).toBe("4월~11월");
    expect(formatKidsForestOperatingPeriod("2026년 9~12월")).toBe("9월~12월");
  });

  it("keeps non year-month period descriptions unchanged", () => {
    expect(formatKidsForestOperatingPeriod("4월~11월 (월요일 휴무)")).toBe("4월~11월 (월요일 휴무)");
  });

  it("uses the normalized period across facility surfaces", () => {
    const result = mergeKidsForestFacilities(
      {
        page: 1,
        perPage: 1,
        totalCount: 1,
        currentCount: 1,
        matchCount: 1,
        data: [
          {
            시설명: "샘플 유아숲체험원",
            주소: "서울특별시 샘플구 숲길 1",
            운영기간: "2025-03~2025-11",
            전화번호: "02-000-0000",
            참여방법: "전화/방문/공문",
          },
        ],
      },
      [
        {
          name: "샘플 유아숲체험원",
          address: "서울특별시 샘플구 숲길 1",
          lat: 37.5,
          lng: 127,
        },
      ],
    );

    const facility = result.items[0];
    expect(facility.operatingHours).toBe("3월~11월");
    expect(facility.intro).toContain("운영기간: 3월~11월");
    expect(facility.detailSections?.[0]?.items).toContainEqual({
      label: "운영기간",
      value: "3월~11월",
    });
    expect(facility.educationPrograms?.[0]?.period).toBe("3월~11월");
  });
});

describe("kids forest coordinate matching", () => {
  it("uses the address match before a duplicated facility name", () => {
    const result = mergeKidsForestFacilities(
      {
        page: 1,
        perPage: 1,
        totalCount: 1,
        currentCount: 1,
        matchCount: 1,
        data: [
          {
            시설명: "봉화산 유아숲체험원",
            주소: "서울 중랑구 묵동 23-4",
            운영기간: "2025-03~2025-11",
          },
        ],
      },
      [
        {
          name: "봉화산 유아숲체험원",
          address: "전남 순천시 용당동 산50",
          lat: 34.9670438,
          lng: 127.4996417,
        },
        {
          name: "봉화산 유아숲체험원",
          address: "서울 중랑구 묵동 23-4",
          lat: 37.6140996,
          lng: 127.0847888,
        },
      ],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      address: "서울 중랑구 묵동 23-4",
      lat: 37.6140996,
      lng: 127.0847888,
    });
  });

  it("does not fall back to a duplicated facility name when the address is unmatched", () => {
    const result = mergeKidsForestFacilities(
      {
        page: 1,
        perPage: 1,
        totalCount: 1,
        currentCount: 1,
        matchCount: 1,
        data: [
          {
            시설명: "남산 유아숲체험원",
            주소: "서울특별시 중구 예시동 산1",
            운영기간: "2025-03~2025-11",
          },
        ],
      },
      [
        {
          name: "남산 유아숲체험원",
          address: "울산광역시 남구 무거동 산86",
          lat: 35.545484,
          lng: 129.29165,
        },
        {
          name: "남산 유아숲체험원",
          address: "강원 홍천군 홍천읍 연봉리 산 9-1",
          lat: 37.676632,
          lng: 127.8823523,
        },
      ],
    );

    expect(result.items).toHaveLength(0);
    expect(result.missingCoordinateCount).toBe(1);
  });
});
