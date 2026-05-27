import { describe, expect, it, vi } from "vitest";

import { handleHealingForestsApiRequest } from "./healing-forest-api-route";

const successPayload = {
  page: 1,
  perPage: 1,
  totalCount: 33,
  currentCount: 1,
  matchCount: 33,
  data: [
    {
      연번: 1,
      지역: "강원",
      시설명: "국립대관령치유의숲",
      주소: "강원특별자치도 강릉시 성산면 대관령옛길 127-42",
    },
  ],
};

describe("handleHealingForestsApiRequest", () => {
  it("returns normalized healing forests when the server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(successPayload));

    const response = await handleHealingForestsApiRequest(
      new Request("https://forest.test/api/healing-forests?page=1&perPage=1"),
      { HEALING_FOREST_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        totalCount: 33,
        items: [
          {
            facilityName: "국립대관령치유의숲",
            region: "강원",
          },
        ],
      },
      cached: false,
    });
  });

  it("rejects requests when no service key is available", async () => {
    const response = await handleHealingForestsApiRequest(
      new Request("https://forest.test/api/healing-forests"),
      {
        HEALING_FOREST_SERVICE_KEY: "",
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
