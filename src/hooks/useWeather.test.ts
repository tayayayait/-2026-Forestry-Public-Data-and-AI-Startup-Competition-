import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WEATHER_COORDS,
  getHydrationSafeInitialCoords,
  getHydrationSafeWeatherPlaceholder,
} from "./useWeather";

function stubBrowserStorage(value: string) {
  const localStorage = {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  };

  vi.stubGlobal("window", { localStorage });
  vi.stubGlobal("localStorage", localStorage);
  return localStorage;
}

describe("useWeather hydration defaults", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not seed the first weather render from browser cache", () => {
    const localStorage = stubBrowserStorage(
      JSON.stringify({
        temperature: 11,
        weatherCode: 0,
        uvIndex: 2,
        pm10: 15,
        locationName: "Gumi-si",
      }),
    );

    const placeholder = getHydrationSafeWeatherPlaceholder();

    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(placeholder.temperature).toBe(20);
    expect(placeholder.locationName).not.toBe("Gumi-si");
  });

  it("does not seed the first coordinates render from browser cache", () => {
    const localStorage = stubBrowserStorage(JSON.stringify({ lat: 36.1195, lon: 128.3446 }));

    expect(getHydrationSafeInitialCoords()).toEqual(DEFAULT_WEATHER_COORDS);
    expect(localStorage.getItem).not.toHaveBeenCalled();
  });
});
