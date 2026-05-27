import { describe, expect, it } from "vitest";

import {
  buildFacilityProgramFallbacks,
  buildProgramFacts,
  getProgramDisplayTitle,
  orderEducationPrograms,
} from "./ProgramInfoSection";
import type { FacilityInfo, ForestEducationProgram } from "@/types";

describe("ProgramInfoSection facility program formatting", () => {
  it("uses the facility name when a program row omits title", () => {
    const program: ForestEducationProgram = {
      title: "",
      content: "",
      facilityName: "제주절물자연휴양림",
    };

    expect(getProgramDisplayTitle(program)).toBe("제주절물자연휴양림");
  });

  it("builds user-facing facts from program fields", () => {
    const program: ForestEducationProgram = {
      title: "제주절물자연휴양림",
      content: "숲 해설 및 생태 체험",
      facilityName: "제주절물자연휴양림",
      address: "제주시 봉개동 산78-1",
      category: "관찰, 체험",
      period: "2~11월",
      managementAgency: "제주절물자연휴양림",
      tel: "064-728-3637",
      department: "산림교육문화과",
      registeredAt: "2026-03-06",
    };

    expect(buildProgramFacts(program).map(({ label, value }) => [label, value])).toEqual([
      ["운영기간", "2~11월"],
      ["프로그램 분류", "관찰, 체험"],
      ["관리기관", "제주절물자연휴양림"],
      ["문의", "064-728-3637"],
      ["주소", "제주시 봉개동 산78-1"],
      ["담당부서", "산림교육문화과"],
      ["등록일", "2026-03-06"],
    ]);
  });

  it("filters empty fields before rendering fact rows", () => {
    const program: ForestEducationProgram = {
      title: "프로그램",
      content: "",
      period: "4~10월",
    };

    expect(buildProgramFacts(program).map((fact) => fact.label)).toEqual(["운영기간"]);
  });

  it("orders programs with descriptions before basic operation rows", () => {
    const programs: ForestEducationProgram[] = [
      {
        title: "운영 정보",
        content: "",
      },
      {
        title: "설명 정보",
        content: "프로그램 설명입니다.",
      },
    ];

    expect(orderEducationPrograms(programs).map((program) => program.title)).toEqual([
      "설명 정보",
      "운영 정보",
    ]);
  });

  it("builds a healing forest fallback program from facility facts", () => {
    const facility: FacilityInfo = {
      id: "healing-forest-8",
      name: "망경대산 치유의숲",
      type: "healing_forest",
      address: "강원도 영월군 중동면 선도우길 177",
      lat: 37.17627,
      lng: 128.59766,
      tel: "033-375-8600",
      operatingHours: "4월~11월",
      programs: ["산림치유"],
      trails: [],
      accessibility: {
        wheelchair: false,
        stroller: false,
        parking: true,
        restroom: true,
        elevator: false,
        helpdog: false,
      },
      detailSections: [
        {
          title: "운영 정보",
          items: [{ label: "관리주체", value: "공립" }],
        },
      ],
    };

    expect(buildFacilityProgramFallbacks(facility)[0]).toMatchObject({
      title: "망경대산 치유의숲 산림치유 프로그램",
      facilityName: "망경대산 치유의숲",
      address: "강원도 영월군 중동면 선도우길 177",
      category: "산림치유",
      period: "4월~11월",
      managementAgency: "공립",
      tel: "033-375-8600",
    });
  });

  it("does not build facility fallback rows for non-healing forest facilities", () => {
    const facility: FacilityInfo = {
      id: "recreation-forest-1",
      name: "망경대산자연휴양림",
      type: "recreation_forest",
      address: "강원도 영월군 중동면 선도우길 177",
      lat: 37.17627,
      lng: 128.59766,
      programs: ["자연휴양림"],
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

    expect(buildFacilityProgramFallbacks(facility)).toEqual([]);
  });

  it("keeps kids forest program rows from the kids forest facility source", () => {
    const facility: FacilityInfo = {
      id: "kids-forest-1",
      name: "경암근린공원 유아숲체험원",
      type: "kids_forest",
      address: "광주광역시 광산구 하남대로54번안길 133",
      lat: 35.1,
      lng: 126.8,
      programs: ["유아숲체험"],
      trails: [],
      accessibility: {
        wheelchair: false,
        stroller: true,
        parking: false,
        restroom: false,
        elevator: false,
        helpdog: false,
      },
      educationPrograms: [
        {
          title: "유아숲체험원 참여 안내",
          content: "",
          facilityName: "경암근린공원 유아숲체험원",
          address: "광주광역시 광산구 하남대로54번안길 133",
          period: "3월~11월",
          tel: "062-960-8677",
          category: "유아숲체험",
        },
      ],
    };

    expect(buildFacilityProgramFallbacks(facility)[0]).toMatchObject({
      title: "유아숲체험원 참여 안내",
      period: "3월~11월",
      tel: "062-960-8677",
    });
  });
});
