import { describe, expect, it, vi } from "vitest";

import {
  buildHealingForestsUrl,
  fetchHealingForests,
  normalizeHealingForestsResponse,
} from "./healing-forest";

const successPayload = {
  page: 1,
  perPage: 1,
  totalCount: 33,
  currentCount: 1,
  matchCount: 33,
  data: [
    {
      연번: 1,
      지역: "강원",
      시설명: "국립대관령치유의숲",
      주소: "강원특별자치도 강릉시 성산면 대관령옛길 127-42",
      전화번호: "033-642-8651",
      홈페이지: "https://www.fowi.or.kr",
      참여방법: "사전예약",
      관리주체: "한국산림복지진흥원",
    },
  ],
};

describe("buildHealingForestsUrl", () => {
  it("builds the odcloud healing forest request", () => {
    const urlString = buildHealingForestsUrl({
      serviceKey: "decoded-key",
      page: 2,
      perPage: 20,
    });

    const url = new URL(urlString);

    expect(url.origin + url.pathname).toBe(
      "https://api.odcloud.kr/api/15107928/v1/uddi:bb6d1462-c89b-4007-9eaa-a0ced9e50fd9",
    );
    expect(url.searchParams.get("serviceKey")).toBe("decoded-key");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("perPage")).toBe("20");
    expect(url.searchParams.get("returnType")).toBe("JSON");
  });
});

describe("normalizeHealingForestsResponse", () => {
  it("normalizes odcloud healing forest data into app data", () => {
    expect(normalizeHealingForestsResponse(successPayload)).toEqual({
      page: 1,
      perPage: 1,
      totalCount: 33,
      currentCount: 1,
      matchCount: 33,
      items: [
        {
          serialNumber: 1,
          region: "강원",
          facilityName: "국립대관령치유의숲",
          address: "강원특별자치도 강릉시 성산면 대관령옛길 127-42",
          telephoneNumber: "033-642-8651",
          homepage: "https://www.fowi.or.kr",
          participationMethod: "사전예약",
          operator: "한국산림복지진흥원",
        },
      ],
    });
  });

  it("throws the odcloud error message when authentication fails", () => {
    expect(() =>
      normalizeHealingForestsResponse({
        code: -4,
        msg: "등록되지 않은 인증키 입니다.",
      }),
    ).toThrow("등록되지 않은 인증키 입니다.");
  });
});

describe("fetchHealingForests", () => {
  it("fetches and normalizes healing forest data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(successPayload));

    const response = await fetchHealingForests({
      serviceKey: "decoded-key",
      page: 1,
      perPage: 1,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![0].toString()).toContain("15107928");
    expect(response.totalCount).toBe(33);
    expect(response.items[0]!).toMatchObject({
      facilityName: "국립대관령치유의숲",
      region: "강원",
    });
  });
});
