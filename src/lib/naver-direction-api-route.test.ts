import { afterEach, describe, expect, it, vi } from "vitest";

import { handleNaverDirectionApiRequest, parseLngLatParam } from "./naver-direction-api-route";

const routePayload = {
  code: 0,
  route: {
    traoptimal: [
      {
        summary: {
          distance: 1000,
          duration: 120000,
          taxiFare: 5000,
          tollFare: 0,
        },
        path: [
          [128.1, 36.1],
          [128.2, 36.2],
        ],
      },
    ],
  },
};

describe("handleNaverDirectionApiRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses lng,lat parameters", () => {
    expect(parseLngLatParam("128.42321732497828,36.138466355807736")).toEqual({
      lat: 36.138466355807736,
      lng: 128.42321732497828,
    });
    expect(parseLngLatParam("36.138466355807736,128.42321732497828")).toBeNull();
    expect(parseLngLatParam("invalid")).toBeNull();
  });

  it("returns a normalized route without exposing client secret to the browser", async () => {
    const fetchImpl = vi.fn(async () => Response.json(routePayload));

    const response = await handleNaverDirectionApiRequest(
      new Request(
        "https://forest.test/api/naver-direction?start=128.42321732497828,36.138466355807736&goal=128.885441,37.550868",
      ),
      {
        NAVER_MAPS_CLIENT_ID: "client-id",
        NAVER_MAPS_CLIENT_SECRET: "client-secret",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        distance: 1000,
        duration: 120,
        path: [
          { lat: 36.1, lng: 128.1 },
          { lat: 36.2, lng: 128.2 },
        ],
      },
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          "x-ncp-apigw-api-key-id": "client-id",
          "x-ncp-apigw-api-key": "client-secret",
        },
      }),
    );
  });

  it("returns a fallback payload when credentials are missing", async () => {
    vi.stubEnv("NAVER_MAPS_CLIENT_ID", "");
    vi.stubEnv("VITE_NAVER_MAPS_CLIENT_ID", "");
    vi.stubEnv("NAVER_MAPS_CLIENT_SECRET", "");
    vi.stubEnv("VITE_NAVER_MAPS_CLIENT_SECRET", "");

    const response = await handleNaverDirectionApiRequest(
      new Request(
        "https://forest.test/api/naver-direction?start=128.42321732497828,36.138466355807736&goal=128.885441,37.550868",
      ),
      {},
      vi.fn(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      data: null,
      error: "NAVER_MAPS_CLIENT_ID and NAVER_MAPS_CLIENT_SECRET are required.",
    });
  });

  it("converts Naver subscription errors into non-throwing fallback payloads", async () => {
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

    const response = await handleNaverDirectionApiRequest(
      new Request(
        "https://forest.test/api/naver-direction?start=128.42321732497828,36.138466355807736&goal=128.885441,37.550868",
      ),
      {
        NAVER_MAPS_CLIENT_ID: "client-id",
        NAVER_MAPS_CLIENT_SECRET: "client-secret",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      data: null,
      error: "Naver Directions 5 API subscription is required.",
    });
  });
});
