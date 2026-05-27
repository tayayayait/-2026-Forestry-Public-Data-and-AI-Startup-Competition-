import { describe, expect, it, vi } from "vitest";

import { moveMapToCenter } from "./NaverMap";
import type { NaverMapInstance, NaverMapsNamespace } from "@/lib/naver-maps";

describe("moveMapToCenter", () => {
  it("updates the native Naver map center to the latest user coordinates", () => {
    const setCenter = vi.fn();
    const map = { setCenter } as NaverMapInstance;
    const maps = {
      LatLng: vi.fn(function LatLng(lat: number, lng: number) {
        return { lat, lng };
      }),
    } as unknown as NaverMapsNamespace;

    expect(moveMapToCenter(map, maps, { lat: 33.5, lng: 126.53 })).toBe(true);
    expect(maps.LatLng).toHaveBeenCalledWith(33.5, 126.53);
    expect(setCenter).toHaveBeenCalledWith({ lat: 33.5, lng: 126.53 });
  });

  it("rejects invalid user coordinates without moving the map", () => {
    const setCenter = vi.fn();
    const map = { setCenter } as NaverMapInstance;
    const maps = {
      LatLng: vi.fn(),
    } as unknown as NaverMapsNamespace;

    expect(moveMapToCenter(map, maps, { lat: Number.NaN, lng: 126.53 })).toBe(false);
    expect(setCenter).not.toHaveBeenCalled();
  });
});
