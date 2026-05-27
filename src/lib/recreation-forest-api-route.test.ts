import { describe, expect, it, vi } from "vitest";

import { handleRecreationForestsApiRequest } from "./recreation-forest-api-route";

const successPayload = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
    body: {
      items: [
        {
          rcrfrstNm: "Test Forest",
          ctprvnNm: "Gangwon",
          rdnmadr: "1 Forest Road",
          latitude: "37.1234",
          longitude: "128.1234",
        },
      ],
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

describe("handleRecreationForestsApiRequest", () => {
  it("returns normalized recreation forests when the server key exists", async () => {
    const fetchImpl = vi.fn(async () => Response.json(successPayload));

    const response = await handleRecreationForestsApiRequest(
      new Request("https://forest.test/api/recreation-forests?ctprvnNm=Gangwon&numOfRows=1"),
      { PUBLIC_DATA_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        totalCount: 1,
        items: [
          {
            name: "Test Forest",
            provinceName: "Gangwon",
          },
        ],
      },
      cached: false,
    });
  });

  it("retries transient upstream fetch failures", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(Response.json(successPayload));

    const response = await handleRecreationForestsApiRequest(
      new Request("https://forest.test/api/recreation-forests?numOfRows=1"),
      { PUBLIC_DATA_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        totalCount: 1,
      },
    });
  });

  it("rejects requests when no public-data service key is available", async () => {
    const response = await handleRecreationForestsApiRequest(
      new Request("https://forest.test/api/recreation-forests"),
      {
        RECREATION_FOREST_SERVICE_KEY: "",
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
