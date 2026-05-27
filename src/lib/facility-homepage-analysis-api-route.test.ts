import { describe, expect, it, vi } from "vitest";

import { handleFacilityHomepageAnalysisApiRequest } from "./facility-homepage-analysis-api-route";
import type { FacilityHomepageAnalysis } from "@/types";

const pinnedAnalysis: FacilityHomepageAnalysis = {
  facilityName: "Pinned Forest",
  homepageUrl: "https://example.go.kr",
  analyzedAt: "2026-05-25T06:30:00.000Z",
  retrievalStatus: "success",
  sections: [
    {
      type: "summary",
      title: "summary",
      status: "found",
      items: ["Pinned summary"],
      sourceUrls: ["https://example.go.kr"],
    },
  ],
  missingSections: [],
  sourceUrls: ["https://example.go.kr"],
};

const geminiPayload = {
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
                  items: ["공식 홈페이지에서 확인된 요약입니다."],
                  sourceUrls: ["https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113"],
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

describe("handleFacilityHomepageAnalysisApiRequest", () => {
  it("rejects unsupported request methods", async () => {
    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "PUT",
      }),
      { GEMINI_API_KEY: "secret-key" },
      vi.fn(),
    );

    expect(response.status).toBe(405);
  });

  it("rejects local homepage URLs before calling Gemini", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "로컬 테스트",
          homepageUrl: "http://localhost:3000",
        }),
      }),
      { GEMINI_API_KEY: "secret-key" },
      fetchImpl,
    );

    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a Gemini-backed homepage analysis", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));
    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "자굴산 자연휴양림",
          homepageUrl: "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
        GEMINI_MODEL: "gemini-3-flash-preview",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        facilityName: "자굴산 자연휴양림",
        retrievalStatus: "success",
        sections: [{ type: "summary" }],
      },
    });
  });

  it("returns a pinned homepage analysis before requiring Gemini or calling fetch", async () => {
    const store = {
      read: vi.fn(async () => pinnedAnalysis),
      write: vi.fn(),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "Pinned Forest",
          homepageUrl: "https://example.go.kr",
        }),
      }),
      { GEMINI_API_KEY: "" },
      fetchImpl,
      store,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      cached: true,
      data: pinnedAnalysis,
    });
    expect(store.read).toHaveBeenCalledWith("https://example.go.kr");
    expect(store.write).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("saves successful Gemini homepage analysis results to the pinned store", async () => {
    const store = {
      read: vi.fn(async () => null),
      write: vi.fn(async () => undefined),
    };
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(geminiPayload));

    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "Pinned Forest",
          homepageUrl: "https://example.go.kr",
        }),
      }),
      { GEMINI_API_KEY: "secret-key" },
      fetchImpl,
      store,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      cached: false,
      data: {
        facilityName: "Pinned Forest",
        homepageUrl: "https://example.go.kr/",
      },
    });
    expect(store.write).toHaveBeenCalledWith({
      homepageUrl: payload.data.homepageUrl,
      facilityName: "Pinned Forest",
      analysis: payload.data,
    });
  });

  it("returns pinned homepage analysis via GET without running Gemini", async () => {
    const store = {
      read: vi.fn(async () => pinnedAnalysis),
      write: vi.fn(),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request(
        "https://forest.test/api/facility-homepage-analysis?homepageUrl=https%3A%2F%2Fexample.go.kr",
      ),
      { GEMINI_API_KEY: "" },
      fetchImpl,
      store,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      cached: true,
      data: pinnedAnalysis,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects requests when the Gemini key is missing", async () => {
    const response = await handleFacilityHomepageAnalysisApiRequest(
      new Request("https://forest.test/api/facility-homepage-analysis", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "자굴산 자연휴양림",
          homepageUrl: "https://www.foresttrip.go.kr/indvz/main.do?hmpgId=ID02030113",
        }),
      }),
      { GEMINI_API_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(500);
  });
});
