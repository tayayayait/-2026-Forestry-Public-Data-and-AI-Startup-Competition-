import { describe, expect, it, vi } from "vitest";

import {
  buildRecreationForestsUrl,
  fetchRecreationForests,
  normalizeRecreationForestsResponse,
} from "./recreation-forest";

const successPayload = {
  response: {
    header: {
      resultCode: "00",
      resultMsg: "NORMAL_CODE",
    },
    body: {
      items: [
        {
          rcrfrstNm: "Test Forest",
          ctprvnNm: "Gangwon",
          rcrfrstType: "National",
          rcrfrstAr: "100000",
          aceptncCo: "300",
          admfee: "1000",
          stayngPosblYn: "Y",
          mainFcltyNm: "Trail, Cabin",
          rdnmadr: "1 Forest Road",
          institutionNm: "Forest Office",
          telephoneNumber: "033-000-0000",
          homepageUrl: "https://example.com",
          latitude: "37.1234",
          longitude: "128.1234",
          referenceDate: "2026-03-01",
          instt_code: "1230000",
        },
      ],
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

describe("buildRecreationForestsUrl", () => {
  it("builds the public recreation forest request with JSON output and filters", () => {
    const urlString = buildRecreationForestsUrl({
      serviceKey: "decoded-key",
      pageNo: 2,
      numOfRows: 50,
      ctprvnNm: "Gangwon",
      stayngPosblYn: "Y",
    });

    const url = new URL(urlString);

    expect(url.origin + url.pathname).toBe(
      "https://api.data.go.kr/openapi/tn_pubr_public_rcrfrst_api",
    );
    expect(url.searchParams.get("serviceKey")).toBe("decoded-key");
    expect(url.searchParams.get("type")).toBe("json");
    expect(url.searchParams.get("pageNo")).toBe("2");
    expect(url.searchParams.get("numOfRows")).toBe("50");
    expect(url.searchParams.get("ctprvnNm")).toBe("Gangwon");
    expect(url.searchParams.get("stayngPosblYn")).toBe("Y");
  });
});

describe("normalizeRecreationForestsResponse", () => {
  it("normalizes standard recreation forest data into app data", () => {
    expect(normalizeRecreationForestsResponse(successPayload)).toEqual({
      resultCode: "00",
      resultMsg: "NORMAL_CODE",
      pageNo: 1,
      numOfRows: 1,
      totalCount: 1,
      items: [
        {
          name: "Test Forest",
          provinceName: "Gangwon",
          type: "National",
          area: "100000",
          capacity: 300,
          admissionFee: "1000",
          stayingAvailable: true,
          mainFacilities: "Trail, Cabin",
          roadAddress: "1 Forest Road",
          institutionName: "Forest Office",
          telephoneNumber: "033-000-0000",
          homepageUrl: "https://example.com",
          latitude: 37.1234,
          longitude: 128.1234,
          referenceDate: "2026-03-01",
          providerCode: "1230000",
        },
      ],
    });
  });

  it("throws the API result message for non-normal responses", () => {
    expect(() =>
      normalizeRecreationForestsResponse({
        response: {
          header: {
            resultCode: "30",
            resultMsg: "SERVICE KEY IS NOT REGISTERED ERROR.",
          },
        },
      }),
    ).toThrow("SERVICE KEY IS NOT REGISTERED ERROR.");
  });
});

describe("fetchRecreationForests", () => {
  it("fetches and normalizes recreation forest data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(successPayload));

    const response = await fetchRecreationForests({
      serviceKey: "decoded-key",
      ctprvnNm: "Gangwon",
      numOfRows: 1,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![0].toString()).toContain("tn_pubr_public_rcrfrst_api");
    expect(fetchImpl.mock.calls[0]![1]).toMatchObject({
      headers: {
        accept: "application/json",
      },
    });
    expect(response.totalCount).toBe(1);
    expect(response.items[0]!).toMatchObject({
      name: "Test Forest",
      latitude: 37.1234,
      longitude: 128.1234,
    });
  });
});
