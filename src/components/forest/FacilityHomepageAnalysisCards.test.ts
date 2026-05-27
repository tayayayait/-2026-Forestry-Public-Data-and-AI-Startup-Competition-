import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  getRenderableHomepageAnalysisSections,
  FacilityHomepageAnalysisCards,
} from "./FacilityHomepageAnalysisCards";
import type { FacilityHomepageAnalysis } from "@/types";

const analysis: FacilityHomepageAnalysis = {
  facilityName: "Test Forest",
  homepageUrl: "https://example.go.kr",
  analyzedAt: "2026-05-25T06:30:00.000Z",
  retrievalStatus: "partial",
  sections: [
    {
      type: "fees",
      title: "요금",
      status: "found",
      items: ["입장료 없음"],
      sourceUrls: ["https://example.go.kr/fees"],
    },
    {
      type: "hours",
      title: "운영시간",
      status: "not_found",
      items: [],
      sourceUrls: [],
    },
    {
      type: "summary",
      title: "요약",
      status: "found",
      items: ["숲 체험 중심 시설"],
      sourceUrls: ["https://example.go.kr"],
    },
  ],
  missingSections: ["hours", "reservation"],
  sourceUrls: ["https://example.go.kr", "https://example.go.kr/fees"],
  warning: "일부 페이지만 분석했습니다.",
};

describe("FacilityHomepageAnalysisCards helpers", () => {
  it("renders only found or uncertain sections that have items in the fixed card order", () => {
    expect(getRenderableHomepageAnalysisSections(analysis).map((section) => section.type)).toEqual([
      "summary",
      "fees",
    ]);
  });

  it("does not expose source URLs or analysis timestamp cards in the rendered result", () => {
    const markup = renderToStaticMarkup(
      createElement(FacilityHomepageAnalysisCards, { analysis }),
    );

    expect(markup).not.toContain("https://example.go.kr");
    expect(markup).not.toContain("2026");
  });
});
