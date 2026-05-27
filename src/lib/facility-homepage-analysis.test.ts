import { describe, expect, it, vi } from "vitest";

import {
  analyzeFacilityHomepage,
  deriveOfficialAnalysisUrls,
  isAllowedPublicHttpUrl,
} from "./facility-homepage-analysis";

const analysisPayload = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              retrievalStatus: "success",
              sections: [
                {
                  type: "summary",
                  title: "요약",
                  status: "found",
                  items: ["자굴산 자연휴양림 공식 안내입니다."],
                  sourceUrls: ["https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113"],
                },
                {
                  type: "hours",
                  title: "운영시간",
                  status: "not_found",
                  items: [],
                  sourceUrls: [],
                },
                {
                  type: "fees",
                  title: "요금",
                  status: "found",
                  items: ["성수기와 비수기 요금 기준을 확인해야 합니다."],
                  sourceUrls: [
                    "https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=ID02030113&menuId=004002005&ruleId=205",
                  ],
                },
              ],
              sourceUrls: ["https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113"],
            }),
          },
        ],
      },
    },
  ],
};

describe("deriveOfficialAnalysisUrls", () => {
  it("expands foresttrip homepage URLs into official guide pages", () => {
    const urls = deriveOfficialAnalysisUrls(
      "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
    );

    expect(urls).toEqual([
      "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
      "https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=ID02030113&menuId=004002001&ruleId=201",
      "https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=ID02030113&menuId=004002005&ruleId=205",
      "https://www.foresttrip.go.kr/pot/rm/ug/selectFcltUseGdncView.do?hmpgId=ID02030113&menuId=004002008&ruleId=208",
    ]);
  });
});

describe("isAllowedPublicHttpUrl", () => {
  it("accepts public HTTP(S) URLs and rejects local/private targets", () => {
    expect(isAllowedPublicHttpUrl("https://www.foresttrip.go.kr/")).toBe(true);
    expect(isAllowedPublicHttpUrl("http://localhost:3000")).toBe(false);
    expect(isAllowedPublicHttpUrl("http://127.0.0.1:8787")).toBe(false);
    expect(isAllowedPublicHttpUrl("http://192.168.0.10")).toBe(false);
    expect(isAllowedPublicHttpUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("analyzeFacilityHomepage", () => {
  it("uses Gemini URL context and returns only evidence-backed sections", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(`${init?.body}`) as Record<string, unknown>;
      expect(body).toMatchObject({
        tools: [{ url_context: {} }],
      });
      expect(`${init?.body}`).toContain("ID02030113");
      return Response.json(analysisPayload);
    });

    const result = await analyzeFacilityHomepage({
      apiKey: "secret-key",
      model: "gemini-3-flash-preview",
      facilityName: "자굴산 자연휴양림",
      homepageUrl: "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
      fetchImpl,
    });

    expect(result.retrievalStatus).toBe("success");
    expect(result.sections.map((section) => section.type)).toEqual(["summary", "fees"]);
    expect(result.missingSections).toContain("hours");
    expect(result.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("falls back to fetched page text when URL context fails", async () => {
    let geminiCalls = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = input.toString();
      if (url.includes("generativelanguage.googleapis.com")) {
        geminiCalls += 1;
        if (geminiCalls === 1) {
          return Response.json({ error: { message: "URL context unavailable" } }, { status: 503 });
        }
        expect(`${init?.body}`).not.toContain("url_context");
        expect(`${init?.body}`).toContain("이용객준수사항");
        return Response.json(analysisPayload);
      }

      return new Response("<html><body><main>이용객준수사항: 매주 화요일 휴관</main></body></html>", {
        status: 200,
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    });

    const result = await analyzeFacilityHomepage({
      apiKey: "secret-key",
      model: "gemini-3-flash-preview",
      facilityName: "자굴산 자연휴양림",
      homepageUrl: "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
      fetchImpl,
    });

    expect(geminiCalls).toBe(2);
    expect(result.retrievalStatus).toBe("partial");
  });
});
