import type { FacilityHomepageAnalysis } from "@/types";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const CACHE_VERSION = 1;
export const HOMEPAGE_ANALYSIS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type CachedHomepageAnalysis = {
  version: number;
  storedAt: number;
  analysis: FacilityHomepageAnalysis;
};

function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function normalizeHomepageUrlForCache(value: string): string {
  try {
    const url = new URL(value.trim());
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function getHomepageAnalysisCacheKey(homepageUrl: string): string {
  return `facility-homepage-analysis:v${CACHE_VERSION}:${encodeURIComponent(
    normalizeHomepageUrlForCache(homepageUrl),
  )}`;
}

function isCachedHomepageAnalysis(value: unknown): value is CachedHomepageAnalysis {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CachedHomepageAnalysis>;
  return (
    candidate.version === CACHE_VERSION &&
    typeof candidate.storedAt === "number" &&
    !!candidate.analysis &&
    typeof candidate.analysis === "object"
  );
}

export function readCachedHomepageAnalysis(
  homepageUrl: string,
  storage: StorageLike | null = getDefaultStorage(),
  now = Date.now(),
): FacilityHomepageAnalysis | null {
  if (!storage) return null;

  const cacheKey = getHomepageAnalysisCacheKey(homepageUrl);
  const raw = storage.getItem(cacheKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isCachedHomepageAnalysis(parsed)) {
      storage.removeItem(cacheKey);
      return null;
    }

    if (now - parsed.storedAt >= HOMEPAGE_ANALYSIS_CACHE_TTL_MS) {
      storage.removeItem(cacheKey);
      return null;
    }

    return parsed.analysis;
  } catch {
    storage.removeItem(cacheKey);
    return null;
  }
}

export function writeCachedHomepageAnalysis(
  analysis: FacilityHomepageAnalysis,
  storage: StorageLike | null = getDefaultStorage(),
  now = Date.now(),
): void {
  if (!storage) return;

  const payload: CachedHomepageAnalysis = {
    version: CACHE_VERSION,
    storedAt: now,
    analysis,
  };

  storage.setItem(getHomepageAnalysisCacheKey(analysis.homepageUrl), JSON.stringify(payload));
}

export function clearCachedHomepageAnalysis(
  homepageUrl: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  storage.removeItem(getHomepageAnalysisCacheKey(homepageUrl));
}
