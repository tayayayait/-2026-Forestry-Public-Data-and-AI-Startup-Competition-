import { describe, expect, it, vi } from "vitest";

import {
  buildNaverDirectionUrl,
  fetchNaverDrivingRouteFromNaver,
  NaverDirectionApiError,
} from "./naver-direction";

describe("Naver Directions 5 API", () => {
  it("builds a Directions 5 URL against the active Maps API host", () => {
    const url = buildNaverDirectionUrl(
      { lat: 36.138466355807736, lng: 128.42321732497828 },
      { lat: 37.550868, lng: 128.885441 },
    );

    expect(url).toBe(
      "https://maps.apigw.ntruss.com/map-direction/v1/driving?start=128.42321732497828%2C36.138466355807736&goal=128.885441%2C37.550868",
    );
  });

  it("sends server credentials and normalizes route data", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        code: 0,
        route: {
          traoptimal: [
            {
              summary: {
                distance: 12345,
                duration: 3661000,
                taxiFare: 22000,
                tollFare: 1000,
              },
              path: [
                [128.42321732497828, 36.138466355807736],
                [128.885441, 37.550868],
              ],
              guide: [
                {
                  pointIndex: 1,
                  distance: 12000,
                  instructions: "도착",
                  type: 88,
                },
              ],
            },
          ],
        },
      }),
    );

    const result = await fetchNaverDrivingRouteFromNaver({
      origin: { lat: 36.138466355807736, lng: 128.42321732497828 },
      destination: { lat: 37.550868, lng: 128.885441 },
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("https://maps.apigw.ntruss.com/map-direction/v1/driving?"),
      expect.objectContaining({
        headers: {
          "x-ncp-apigw-api-key-id": "client-id",
          "x-ncp-apigw-api-key": "client-secret",
        },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual({
      distance: 12345,
      duration: 3661,
      taxiFare: 22000,
      tollFare: 1000,
      path: [
        { lat: 36.138466355807736, lng: 128.42321732497828 },
        { lat: 37.550868, lng: 128.885441 },
      ],
      guides: [
        {
          lat: 37.550868,
          lng: 128.885441,
          distance: 12000,
          guidance: "도착",
          type: 88,
        },
      ],
    });
  });

  it("preserves Naver permission errors for server route handling", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        {
          error: {
            errorCode: "210",
            message: "Permission Denied",
            details: "A subscription to the API is required.",
          },
        },
        { status: 401 },
      ),
    );

    await expect(
      fetchNaverDrivingRouteFromNaver({
        origin: { lat: 36.138466355807736, lng: 128.42321732497828 },
        destination: { lat: 37.550868, lng: 128.885441 },
        clientId: "client-id",
        clientSecret: "client-secret",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      status: 401,
      errorCode: "210",
      details: "A subscription to the API is required.",
    });
  });
});
