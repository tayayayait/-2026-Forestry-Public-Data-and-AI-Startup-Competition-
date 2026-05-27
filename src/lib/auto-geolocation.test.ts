import { describe, expect, it } from "vitest";

import { shouldAutoRequestLocation } from "./auto-geolocation";

describe("shouldAutoRequestLocation", () => {
  it("requests location once when the app has no coordinates and permission is still prompt", () => {
    expect(
      shouldAutoRequestLocation({
        coords: null,
        status: "idle",
        permission: "prompt",
      }),
    ).toBe(true);
  });

  it("does not request location again while loading or after denial", () => {
    expect(
      shouldAutoRequestLocation({
        coords: null,
        status: "loading",
        permission: "prompt",
      }),
    ).toBe(false);
    expect(
      shouldAutoRequestLocation({
        coords: null,
        status: "error",
        permission: "denied",
      }),
    ).toBe(false);
  });

  it("does not request location when coordinates already exist", () => {
    expect(
      shouldAutoRequestLocation({
        coords: { lat: 33.5, lng: 126.53 },
        status: "success",
        permission: "granted",
      }),
    ).toBe(false);
  });
});
