import { describe, expect, it } from "vitest";

import {
  mapRecreationForestsToFacilities,
  mergeForestEducationProgramsIntoFacilities,
} from "./public-forest-facilities";
import type { FacilityInfo, ForestEducationProgramList, RecreationForestList } from "@/types";

describe("mapRecreationForestsToFacilities", () => {
  it("keeps facility ids unique when recreation forest names are duplicated", () => {
    const list: RecreationForestList = {
      resultCode: "00",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 2,
      totalCount: 2,
      items: [
        {
          name: "거제자연휴양림",
          provinceName: "경상남도",
          capacity: null,
          stayingAvailable: null,
          roadAddress: "경상남도 거제시 주소 1",
          latitude: 34.9,
          longitude: 128.6,
        },
        {
          name: "거제자연휴양림",
          provinceName: "경상남도",
          capacity: null,
          stayingAvailable: null,
          roadAddress: "경상남도 거제시 주소 2",
          latitude: 34.91,
          longitude: 128.61,
        },
      ],
    };

    const ids = mapRecreationForestsToFacilities(list).map((facility) => facility.id);

    expect(new Set(ids).size).toBe(2);
  });

  it("shows the recreation forest area with a square meter unit", () => {
    const list: RecreationForestList = {
      resultCode: "00",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 1,
      totalCount: 1,
      items: [
        {
          name: "테스트자연휴양림",
          provinceName: "경상북도",
          area: "30000",
          capacity: 500,
          stayingAvailable: null,
          roadAddress: "경상북도 봉화군 봉성면 시거리길 378",
          latitude: 36.9,
          longitude: 128.7,
        },
      ],
    };

    const [facility] = mapRecreationForestsToFacilities(list);
    const facilityInfo = facility.detailSections?.find((section) => section.title === "시설 정보");

    expect(facilityInfo?.items).toContainEqual({ label: "휴양림 면적", value: "30,000㎡" });
  });
});

describe("mergeForestEducationProgramsIntoFacilities", () => {
  const baseFacility: FacilityInfo = {
    id: "facility-1",
    name: "Dodeum Youth Forest",
    type: "education",
    address: "Pohang",
    lat: 36,
    lng: 129,
    programs: [],
    trails: [],
    accessibility: {
      wheelchair: false,
      stroller: false,
      parking: true,
      restroom: true,
      elevator: false,
      helpdog: false,
    },
  };

  it("matches eduType 1 descriptions by title when facnm and addr are absent", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "(region) Dodeum Youth Forest",
          content: "Forest education content for children.",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };

    const [facility] = mergeForestEducationProgramsIntoFacilities([baseFacility], list);

    expect(facility.educationPrograms?.[0]).toMatchObject({
      title: "(region) Dodeum Youth Forest",
      content: "Forest education content for children.",
    });
  });

  it("keeps existing facility program rows when adding description rows", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "(region) Dodeum Youth Forest",
          content: "Forest education content for children.",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };
    const facility = {
      ...baseFacility,
      educationPrograms: [
        {
          title: "Basic operation row",
          content: "",
          facilityName: "Dodeum Youth Forest",
          period: "4~10월",
        },
      ],
    };

    const [merged] = mergeForestEducationProgramsIntoFacilities([facility], list);

    expect(merged.educationPrograms?.map((program) => program.title)).toEqual([
      "Basic operation row",
      "(region) Dodeum Youth Forest",
    ]);
  });

  it("deduplicates repeated education programs across response groups", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "(region) Dodeum Youth Forest",
          content: "Forest education content for children.",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };
    const facility = {
      ...baseFacility,
      educationPrograms: [
        {
          title: "(region) Dodeum Youth Forest",
          content: "Forest education content for children.",
        },
      ],
    };

    const [merged] = mergeForestEducationProgramsIntoFacilities([facility], list);

    expect(merged.educationPrograms).toHaveLength(1);
  });

  it("does not match generic facility names to every healing forest", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "Healing forest",
          content: "",
          facilityName: "치유의 숲",
          address: "Different address",
          category: "관찰, 체험",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };
    const facility = {
      ...baseFacility,
      name: "산음 치유의숲",
      type: "healing_forest" as const,
      address: "경기도 양평군 단월면 고북길 347",
    };

    const [merged] = mergeForestEducationProgramsIntoFacilities([facility], list);

    expect(merged.educationPrograms).toBeUndefined();
  });

  it("does not match same-address education rows when specific facility names differ", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "망경대산자연휴양림",
          content: "",
          facilityName: "망경대산자연휴양림",
          address: "강원도 영월군 중동면 선도우길 177",
          category: "관찰, 체험, 공예",
          period: "2~11월",
          tel: "033-370-2750",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };
    const facility = {
      ...baseFacility,
      name: "망경대산 치유의 숲",
      type: "healing_forest" as const,
      address: "강원도 영월군 중동면 선도우길 177",
      tel: "033-375-8600",
    };

    const [merged] = mergeForestEducationProgramsIntoFacilities([facility], list);

    expect(merged.educationPrograms).toBeUndefined();
  });

  it("matches same-address education rows when specific facility names are compatible", () => {
    const list: ForestEducationProgramList = {
      items: [
        {
          title: "망경대산자연휴양림",
          content: "",
          facilityName: "망경대산자연휴양림",
          address: "강원도 영월군 중동면 선도우길 177",
          category: "관찰, 체험, 공예",
          period: "2~11월",
          tel: "033-370-2750",
        },
      ],
      page: 1,
      perPage: 1,
      totalCount: 1,
      currentCount: 1,
      matchCount: 1,
    };
    const facility = {
      ...baseFacility,
      name: "망경대산자연휴양림",
      type: "recreation_forest" as const,
      address: "강원도 영월군 중동면 선도우길 177",
    };

    const [merged] = mergeForestEducationProgramsIntoFacilities([facility], list);

    expect(merged.educationPrograms?.[0]).toMatchObject({
      facilityName: "망경대산자연휴양림",
      period: "2~11월",
      tel: "033-370-2750",
    });
  });
});
