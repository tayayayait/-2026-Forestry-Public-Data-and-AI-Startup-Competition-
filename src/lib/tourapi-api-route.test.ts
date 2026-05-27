import { describe, expect, it, vi } from "vitest";

import { handleTourismApiRequest } from "./tourapi-api-route";

const successPayload = {
  response: {
    header: { resultCode: "0000", resultMsg: "OK" },
    body: {
      items: {
        item: [
          {
            contentid: "1",
            contenttypeid: "39",
            title: "Forest Restaurant",
            addr1: "1 Food Road",
            dist: "900",
            mapx: "128.1234",
            mapy: "37.1234",
            lclsSystm1: "FD",
            lclsSystm2: "FD01",
          },
        ],
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

describe("handleTourismApiRequest", () => {
  it("returns normalized nearby tourism places when a server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(successPayload));

    const response = await handleTourismApiRequest(
      new Request("https://forest.test/api/tourism?lat=37.1234&lng=128.1234&radius=5000"),
      { TOUR_API_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: [
        {
          type: "restaurant",
          name: "Forest Restaurant",
          distance: "900m",
        },
      ],
      cached: false,
    });
  });

  it("rejects invalid coordinates", async () => {
    const response = await handleTourismApiRequest(
      new Request("https://forest.test/api/tourism?lat=abc&lng=128.1234"),
      { TOUR_API_SERVICE_KEY: "decoded-key" },
      vi.fn(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });

  it("rejects requests when no TourAPI service key is available", async () => {
    const response = await handleTourismApiRequest(
      new Request("https://forest.test/api/tourism?lat=37.1234&lng=128.1234"),
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
