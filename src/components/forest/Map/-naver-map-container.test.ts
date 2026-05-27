import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/forest/Map/NaverMap.tsx"),
  "utf8",
);

describe("NaverMap container", () => {
  it("keeps explicit dimensions after the Naver SDK rewrites container positioning", () => {
    expect(source).toContain("absolute inset-0 h-full w-full");
  });

  it("defensively detaches overlays when the Naver SDK is in a failed auth state", () => {
    expect(source).toContain("safeDetachOverlay");
    expect(source).toContain("try {");
    expect(source).toContain("overlay.setMap?.(null)");
  });

  it("falls back instead of throwing when the Naver SDK namespace is present but unusable", () => {
    expect(source).toContain("function createNaverLatLng");
    expect(source).toContain("safeDestroyMap(mapInstanceRef.current)");
    expect(source).toContain('setStatus("error")');
  });
});
