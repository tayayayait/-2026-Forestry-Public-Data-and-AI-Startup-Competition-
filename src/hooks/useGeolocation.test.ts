import { describe, expect, it } from "vitest";

import { getGeolocationFailurePermission } from "./useGeolocation";

describe("getGeolocationFailurePermission", () => {
  it("marks only explicit permission denial as denied", () => {
    expect(getGeolocationFailurePermission({ code: 1 })).toBe("denied");
  });

  it("keeps prompt permission for timeout or unavailable position failures", () => {
    expect(getGeolocationFailurePermission({ code: 2 })).toBe("prompt");
    expect(getGeolocationFailurePermission({ code: 3 })).toBe("prompt");
  });
});
