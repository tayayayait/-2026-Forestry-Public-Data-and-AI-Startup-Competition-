import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const recommendRouteSource = readFileSync(
  resolve(process.cwd(), "src/routes/recommend.tsx"),
  "utf8",
);

describe("recommend route data readiness", () => {
  it("loads current location and real environment data before requesting a recommendation", () => {
    expect(recommendRouteSource).toContain("useGeolocation");
    expect(recommendRouteSource).toContain("useWeather");
    expect(recommendRouteSource).toContain("useAirQuality");
    expect(recommendRouteSource).toContain("useUvIndex");
    expect(recommendRouteSource).toContain("environmentReady");
    expect(recommendRouteSource).toContain("location: locationCoords");
    expect(recommendRouteSource).toContain("weather: weatherQuery.data");
    expect(recommendRouteSource).toContain("airQuality: airQualityQuery.data");
    expect(recommendRouteSource).toContain("uvIndex: uvIndexQuery.data?.uvIndex");
  });
});
