import { describe, expect, it } from "vitest";

import { createLatLngProjector, projectLatLngToPercent } from "./map-projection";

describe("projectLatLngToPercent", () => {
  it("projects facility coordinates into padded map percentages", () => {
    const points = [
      { lat: 33, lng: 126 },
      { lat: 38, lng: 130 },
      { lat: 35, lng: 128 },
    ];

    expect(projectLatLngToPercent(points[0], points)).toEqual({ top: 80, left: 15 });
    expect(projectLatLngToPercent(points[1], points)).toEqual({ top: 20, left: 85 });
  });

  it("keeps a single point centered", () => {
    expect(projectLatLngToPercent({ lat: 37, lng: 127 }, [{ lat: 37, lng: 127 }])).toEqual({
      top: 50,
      left: 50,
    });
  });

  it("creates a reusable projector from the same bounds", () => {
    const project = createLatLngProjector([
      { lat: 33, lng: 126 },
      { lat: 38, lng: 130 },
    ]);

    expect(project({ lat: 33, lng: 126 })).toEqual({ top: 80, left: 15 });
    expect(project({ lat: 38, lng: 130 })).toEqual({ top: 20, left: 85 });
  });
});
