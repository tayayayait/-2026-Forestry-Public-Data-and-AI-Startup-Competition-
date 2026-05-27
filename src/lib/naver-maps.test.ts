import { describe, expect, it, vi } from "vitest";

import {
  buildNaverMapsScriptUrl,
  loadNaverMapsScript,
  readNaverMapsClientId,
  resetNaverMapsLoaderForTests,
  type NaverMapsNamespace,
} from "./naver-maps";

describe("buildNaverMapsScriptUrl", () => {
  it("builds a Naver Maps v3 script URL with ncpKeyId", () => {
    const url = buildNaverMapsScriptUrl({
      clientId: "client-id",
      submodules: ["geocoder"],
    });

    expect(url.origin + url.pathname).toBe("https://oapi.map.naver.com/openapi/v3/maps.js");
    expect(url.searchParams.get("ncpKeyId")).toBe("client-id");
    expect(url.searchParams.get("submodules")).toBe("geocoder");
  });

  it("trims accidental quotes from the client ID", () => {
    expect(buildNaverMapsScriptUrl({ clientId: '"client-id"' }).searchParams.get("ncpKeyId")).toBe(
      "client-id",
    );
  });
});

describe("readNaverMapsClientId", () => {
  it("prefers the public Vite client ID", () => {
    expect(
      readNaverMapsClientId({
        VITE_NAVER_MAPS_CLIENT_ID: "public-id",
        NAVER_MAPS_CLIENT_ID: "server-id",
      }),
    ).toBe("public-id");
  });

  it("falls back to the server-style key for tests and SSR helpers", () => {
    expect(readNaverMapsClientId({ NAVER_MAPS_CLIENT_ID: "server-id" })).toBe("server-id");
  });
});

describe("loadNaverMapsScript", () => {
  it("loads one script tag and resolves when the SDK is available", async () => {
    resetNaverMapsLoaderForTests();
    const scriptElements: Array<Record<string, unknown>> = [];
    const maps: NaverMapsNamespace = {
      Map: vi.fn(),
      LatLng: vi.fn(),
      Marker: vi.fn(),
      Polyline: vi.fn(),
      Size: vi.fn(),
      Point: vi.fn(),
      Event: { addListener: vi.fn() },
    };
    const windowRef = {} as Window & typeof globalThis;
    const documentRef = {
      getElementById: vi.fn(() => null),
      createElement: vi.fn(() => {
        const script: Record<string, unknown> = {};
        scriptElements.push(script);
        return script;
      }),
      head: {
        appendChild: vi.fn((script: { onload?: () => void }) => {
          setTimeout(() => {
            windowRef.naver = { maps };
            script.onload?.();
          }, 0);
        }),
      },
    } as unknown as Document;

    await expect(loadNaverMapsScript("client-id", { documentRef, windowRef })).resolves.toBe(maps);

    expect(documentRef.createElement).toHaveBeenCalledWith("script");
    expect(documentRef.head.appendChild).toHaveBeenCalledTimes(1);
    expect(`${scriptElements[0]!.src}`).toContain("ncpKeyId=client-id");
  });

  it("rejects when client ID is missing", async () => {
    resetNaverMapsLoaderForTests();
    await expect(
      loadNaverMapsScript("", {
        documentRef: {} as Document,
        windowRef: {} as Window & typeof globalThis,
      }),
    ).rejects.toThrow("NAVER Maps Client ID is not configured.");
  });

  it("rejects when the SDK namespace exists but cannot create coordinates", async () => {
    resetNaverMapsLoaderForTests();
    const maps: NaverMapsNamespace = {
      Map: vi.fn(),
      LatLng: vi.fn(() => {
        throw new Error("unauthorized");
      }),
      Marker: vi.fn(),
      Polyline: vi.fn(),
      Size: vi.fn(),
      Point: vi.fn(),
      Event: { addListener: vi.fn() },
    };
    const windowRef = { naver: { maps } } as unknown as Window & typeof globalThis;

    await expect(
      loadNaverMapsScript("client-id", {
        documentRef: {} as Document,
        windowRef,
      }),
    ).rejects.toThrow("NAVER Maps SDK is unavailable or unauthorized for this domain.");
  });
});
