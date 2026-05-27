import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(resolve(process.cwd(), "src/routes/home.tsx"), "utf8");
const kidsMapPath = resolve(process.cwd(), "src/routes/kids-map.tsx");
const kidsHookPath = resolve(process.cwd(), "src/hooks/useKidsForestFacilities.ts");
const kidsOverlayPath = resolve(process.cwd(), "src/components/forest/KidsForestMapOverlay.tsx");

describe("kids forest dedicated map", () => {
  it("adds a service-home entry point for the child-focused forest map", () => {
    expect(homeSource).toContain('to="/kids-map"');
    expect(homeSource).toContain("아이들과 함께하는 숲체험");
  });

  it("keeps child forest exploration on a dedicated map route", () => {
    expect(existsSync(kidsMapPath)).toBe(true);
    const kidsMapSource = readFileSync(kidsMapPath, "utf8");

    expect(kidsMapSource).toContain('createFileRoute("/kids-map")');
    expect(kidsMapSource).toContain("useKidsForestFacilities");
    expect(kidsMapSource).toContain("KidsForestMapOverlay");
    expect(kidsMapSource).toContain("NaverMap");
    expect(kidsMapSource).toContain('region.id !== "all"');
    expect(kidsMapSource).not.toContain("useFacilities");
  });

  it("loads child forest facilities through a dedicated hook and overlay", () => {
    expect(existsSync(kidsHookPath)).toBe(true);
    expect(existsSync(kidsOverlayPath)).toBe(true);

    const hookSource = readFileSync(kidsHookPath, "utf8");
    const overlaySource = readFileSync(kidsOverlayPath, "utf8");

    expect(hookSource).toContain("/api/kids-forests");
    expect(overlaySource).toContain("participationMethod");
    expect(overlaySource).toContain("tel:");
    expect(overlaySource).toContain("map.kakao.com/link/to");
  });
});
