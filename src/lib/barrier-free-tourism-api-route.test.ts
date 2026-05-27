import { describe, expect, it, vi } from "vitest";

import { handleBarrierFreeTourismApiRequest } from "./barrier-free-tourism-api-route";

const detailPayload = {
  response: {
    header: { resultCode: "0000", resultMsg: "OK" },
    body: {
      items: {
        item: {
          contentid: "988449",
          parking: "장애인 주차장 있음",
          wheelchair: "대여가능",
          restroom: "장애인 화장실 있음",
        },
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

describe("handleBarrierFreeTourismApiRequest", () => {
  it("returns normalized barrier-free details when a server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(detailPayload));

    const response = await handleBarrierFreeTourismApiRequest(
      new Request("https://forest.test/api/barrier-free-tourism?contentId=988449"),
      { TOUR_API_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        contentId: "988449",
        accessibility: {
          parking: true,
          wheelchair: true,
          restroom: true,
        },
      },
      cached: false,
    });
  });

  it("rejects requests without contentId", async () => {
    const response = await handleBarrierFreeTourismApiRequest(
      new Request("https://forest.test/api/barrier-free-tourism"),
      { TOUR_API_SERVICE_KEY: "decoded-key" },
      vi.fn(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });

  it("rejects requests when no TourAPI key is available", async () => {
    const response = await handleBarrierFreeTourismApiRequest(
      new Request("https://forest.test/api/barrier-free-tourism?contentId=988449"),
      {
        TOUR_API_SERVICE_KEY: "",
        PUBLIC_DATA_SERVICE_KEY: "",
        KMA_SERVICE_KEY: "",
      },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });
});
