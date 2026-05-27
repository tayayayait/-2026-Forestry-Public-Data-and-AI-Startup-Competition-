import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readText(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("phase8 Supabase saved-course wiring", () => {
  it("prevents duplicate saved courses by recommendation id in the Edge Function", () => {
    const source = readText("supabase/functions/saved-courses/index.ts");

    expect(source).toContain('.eq("recommendation_id", body.recommendationId)');
    expect(source).toContain(".maybeSingle()");
    expect(source).toContain("existingCourse");
  });

  it("adds an update policy for saved_courses through a migration", () => {
    const migrationDir = resolve(root, "supabase/migrations");
    const combinedSql = readdirSync(migrationDir)
      .filter((name) => name.endsWith(".sql"))
      .map((name) => readFileSync(join(migrationDir, name), "utf8"))
      .join("\n");

    expect(combinedSql).toContain("Users can update own saved courses");
    expect(combinedSql).toContain("ON public.saved_courses FOR UPDATE");
    expect(combinedSql).toContain("idx_saved_courses_user_recommendation");
  });
});
