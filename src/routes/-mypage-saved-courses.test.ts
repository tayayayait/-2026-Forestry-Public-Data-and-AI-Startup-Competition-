import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mypageSource = readFileSync(resolve(process.cwd(), "src/routes/mypage.tsx"), "utf8");

describe("mypage saved courses wiring", () => {
  it("loads saved courses through the persistence hook", () => {
    expect(mypageSource).toContain("useSavedCourses");
    expect(mypageSource).toContain("fetchCourses");
    expect(mypageSource).toContain("savedCourses");
  });

  it("renders saved course states and links persisted recommendations to result detail", () => {
    expect(mypageSource).toContain("저장한 코스");
    expect(mypageSource).toContain("저장된 코스가 없습니다");
    expect(mypageSource).toContain('to="/result/$id"');
    expect(mypageSource).toContain("recommendationId");
  });

  it("wires saved course edit and delete controls", () => {
    expect(mypageSource).toContain("updateCourse");
    expect(mypageSource).toContain("deleteCourse");
    expect(mypageSource).toContain("편집");
    expect(mypageSource).toContain("삭제");
    expect(mypageSource).toContain("저장");
    expect(mypageSource).toContain("취소");
  });
});
