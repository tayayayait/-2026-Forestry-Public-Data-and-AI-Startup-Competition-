import { describe, expect, it, vi } from "vitest";

import { handleUvIndexApiRequest } from "./uv-index-api-route";

const kmaResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
    body: {
      items: {
        item: {
          code: "A07_1",
          areaNo: "1100000000",
          date: "2026052106",
          h0: "5",
          h3: "8",
        },
      },
    },
  },
};

describe("handleUvIndexApiRequest", () => {
  it("returns normalized UV index data from KMA when the server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(kmaResponse));
    const response = await handleUvIndexApiRequest(
      new Request("https://forest.test/api/uv-index?lat=37.5665&lng=126.978"),
      { KMA_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        areaNo: "1100000000",
        areaName: "서울특별시",
        uvIndex: 5,
        uvLevel: "보통",
        forecastHour: 0,
      },
      cached: false,
    });
  });

  it("rejects requests when KMA_SERVICE_KEY is missing", async () => {
    const response = await handleUvIndexApiRequest(
      new Request("https://forest.test/api/uv-index?lat=37.5665&lng=126.978"),
      { KMA_SERVICE_KEY: "", VITE_KMA_SERVICE_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다.",
    });
  });
});
