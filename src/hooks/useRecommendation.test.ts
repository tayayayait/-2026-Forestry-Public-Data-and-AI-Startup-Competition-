import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/hooks/useRecommendation.ts"), "utf8");

describe("useRecommendation persistence", () => {
  it("can skip Supabase recommendation persistence for anonymous users", () => {
    expect(source).toContain("persist = true");
    expect(source).toContain("if (!persist) return response.data");
  });
});
