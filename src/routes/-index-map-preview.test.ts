import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "src/routes/home.tsx"), "utf8");
const layoutSource = readFileSync(
  resolve(process.cwd(), "src/components/forest/AppLayout.tsx"),
  "utf8",
);

describe("home landing page", () => {
  it("renders the introduction page before the service home", () => {
    expect(source).toContain("ForestLandingPage");
    expect(source).toContain("Public Forest Data AI");
    expect(source).toContain("숲이 필요한 순간");
    expect(source).toContain("바로 찾는 산림 치유");
    expect(source).toContain("식물 도감 보기");
    expect(source).not.toContain("오늘 산림 치유 어떠세요");
    expect(source).not.toContain("showIntro");
    expect(source).not.toContain("IntroScreen");
  });

  it("uses the animated WebP background asset on the landing page", () => {
    expect(source).toContain("homeBackgroundWebpSrc");
    expect(source).toContain(
      '"/home-background-16s.webp"',
    );
    expect(source).toContain("<img");
    expect(source).toContain('decoding="async"');
    expect(source).not.toContain("<video");
  });

  it("keeps the introduction route free of the service dashboard wiring", () => {
    expect(source).not.toContain('import { NaverMap } from "@/components/forest/Map/NaverMap"');
    expect(source).not.toContain("buildHomeEnvironmentSummary");
    expect(source).not.toContain("buildDataDrivenCuration");
    expect(source).not.toContain("requestLocation");
  });

  it("enters the service home before map exploration", () => {
    expect(source).toContain('to="/home"');
    expect(source).toContain('to="/plants"');
  });

  it("renders the service home as a mobile service experience with draggable curation", () => {
    expect(homeSource).toContain('createFileRoute("/home")');
    expect(homeSource).toContain("ServiceHomePage");
    expect(homeSource).toContain('from "@/components/ui/carousel"');
    expect(homeSource).toContain('aria-label="빠른 탐색"');
    expect(homeSource).toMatch(/<QuickLink\s+to="\/curation"[\s\S]*?label="테마탐색"/);
    expect(homeSource).not.toContain('label="프로그램"');
    expect(homeSource).toContain("이번 주말, 힐링 명소");
    expect(homeSource).toContain("커뮤니티 핫이슈");
    expect(homeSource).toContain("getCommunityHotIssues");
    expect(homeSource).toContain("useAppStore");
    expect(homeSource).not.toContain("COMMUNITY_HOT_ISSUES");
    expect(homeSource).toContain("dragFree: true");
    expect(layoutSource).toContain('location.pathname === "/"');
    expect(layoutSource).toContain("max-w-[480px]");
    expect(layoutSource).toContain("lg:h-[850px]");
    expect(layoutSource).toContain('{ to: "/home"');
  });
});
