import { describe, expect, it, vi } from "vitest";

import { buildNaverGeocodeUrl, fetchNaverGeocode } from "./naver-geocoding";

describe("Naver geocoding API", () => {
  it("builds a geocoding URL with an encoded query", () => {
    const url = buildNaverGeocodeUrl("경기도 김포시 하성면 가금리 59-1");

    expect(url).toBe(
      "https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=%EA%B2%BD%EA%B8%B0%EB%8F%84+%EA%B9%80%ED%8F%AC%EC%8B%9C+%ED%95%98%EC%84%B1%EB%A9%B4+%EA%B0%80%EA%B8%88%EB%A6%AC+59-1",
    );
  });

  it("sends Naver API key headers and normalizes coordinates", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        status: "OK",
        addresses: [
          {
            roadAddress: "경기도 김포시 하성면 가금리 59-1",
            jibunAddress: "경기도 김포시 하성면 가금리 59-1",
            x: "126.6321",
            y: "37.7199",
          },
        ],
      }),
    );

    const result = await fetchNaverGeocode({
      query: "경기도 김포시 하성면 가금리 59-1",
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl,
      timeoutMs: 1000,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("/map-geocode/v2/geocode?query="),
      expect.objectContaining({
        headers: {
          "x-ncp-apigw-api-key-id": "client-id",
          "x-ncp-apigw-api-key": "client-secret",
        },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual({
      query: "경기도 김포시 하성면 가금리 59-1",
      roadAddress: "경기도 김포시 하성면 가금리 59-1",
      jibunAddress: "경기도 김포시 하성면 가금리 59-1",
      lat: 37.7199,
      lng: 126.6321,
    });
  });
});
