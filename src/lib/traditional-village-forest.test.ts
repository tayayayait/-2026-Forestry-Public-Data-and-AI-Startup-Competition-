import { describe, expect, it, vi } from "vitest";

import {
  buildTraditionalVillageForestsUrl,
  fetchTraditionalVillageForests,
  normalizeTraditionalVillageForestsXml,
} from "./traditional-village-forest";

describe("traditional village forest API", () => {
  it("builds the Forest Service request with guide-backed query parameters", () => {
    const url = buildTraditionalVillageForestsUrl({
      serviceKey: "SERVICE_KEY==",
      searchVllgNm: "가금리",
      searchPlcNm: "경기도",
      pageNo: 1,
      numOfRows: 10,
    });

    expect(url).toContain("traVllgFrstOpenAPI?ServiceKey=SERVICE_KEY");
    expect(url).toContain("searchVllgNm=%EA%B0%80%EA%B8%88%EB%A6%AC");
    expect(url).toContain("searchPlcNm=%EA%B2%BD%EA%B8%B0%EB%8F%84");
    expect(url).toContain("pageNo=1");
    expect(url).toContain("numOfRows=10");
  });

  it("normalizes XML response fields to app types", () => {
    const result = normalizeTraditionalVillageForestsXml(`
      <response>
        <header><resultCode>0000</resultCode><resultMsg>OK</resultMsg></header>
        <body>
          <items>
            <item>
              <travllgfrstnm>가금리 마을숲</travllgfrstnm>
              <matrlnmplc>경기도 김포시 하성면 가금리 59-1</matrlnmplc>
              <mainfoftrnm>느티나무</mainfoftrnm>
              <mainfrtpnm>혼효림</mainfrtpnm>
              <histrexmnncont>역사 설명</histrexmnncont>
              <clturexmnncont>문화 설명</clturexmnncont>
              <zonearea>0.1</zonearea>
            </item>
          </items>
          <numOfRows>10</numOfRows>
          <pageNo>1</pageNo>
          <totalCount>1</totalCount>
        </body>
      </response>
    `);

    expect(result).toMatchObject({
      resultCode: "0000",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 10,
      totalCount: 1,
      items: [
        {
          name: "가금리 마을숲",
          address: "경기도 김포시 하성면 가금리 59-1",
          mainTreeSpecies: "느티나무",
          mainForestType: "혼효림",
          historyContent: "역사 설명",
          cultureContent: "문화 설명",
          zoneAreaSquareMeters: 0.1,
        },
      ],
    });
  });

  it("fetches and normalizes the XML response", async () => {
    const fetchImpl = vi.fn(async () => new Response("<response><body /></response>"));

    await fetchTraditionalVillageForests({
      serviceKey: "SERVICE_KEY",
      searchVllgNm: "가금리",
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
