import { describe, expect, it, vi } from "vitest";

import {
  clearCachedHomepageAnalysis,
  getHomepageAnalysisCacheKey,
  readCachedHomepageAnalysis,
  writeCachedHomepageAnalysis,
} from "./facility-homepage-analysis-cache";
import type { FacilityHomepageAnalysis } from "@/types";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
  };
}

const analysis: FacilityHomepageAnalysis = {
  facilityName: "Test Forest",
  homepageUrl: "HTTPS://Example.go.kr/path",
  analyzedAt: "2026-05-25T06:30:00.000Z",
  retrievalStatus: "success",
  sections: [],
  missingSections: [],
  sourceUrls: ["https://example.go.kr/path"],
};

describe("facility homepage analysis cache", () => {
  it("uses a normalized homepage URL as the stable cache key", () => {
    expect(getHomepageAnalysisCacheKey("HTTPS://Example.go.kr/path")).toBe(
      getHomepageAnalysisCacheKey("https://example.go.kr/path"),
    );
  });

  it("reads a cached analysis before the ttl expires", () => {
    const storage = createStorage();
    writeCachedHomepageAnalysis(analysis, storage, 1000);

    expect(readCachedHomepageAnalysis(analysis.homepageUrl, storage, 1000 + 1000)).toEqual(
      analysis,
    );
  });

  it("removes expired cached analysis results", () => {
    const storage = createStorage();
    writeCachedHomepageAnalysis(analysis, storage, 1000);

    expect(readCachedHomepageAnalysis(analysis.homepageUrl, storage, 1000 + 7 * 60 * 60 * 1000))
      .toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(
      getHomepageAnalysisCacheKey(analysis.homepageUrl),
    );
  });

  it("clears cached analysis for a homepage URL", () => {
    const storage = createStorage();
    writeCachedHomepageAnalysis(analysis, storage, 1000);

    clearCachedHomepageAnalysis(analysis.homepageUrl, storage);

    expect(readCachedHomepageAnalysis(analysis.homepageUrl, storage, 1000)).toBeNull();
  });
});
