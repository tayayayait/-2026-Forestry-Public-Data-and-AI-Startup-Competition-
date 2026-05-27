import { describe, expect, it, vi } from "vitest";

import {
  handleForestPlantImagesApiRequest,
  handleForestPlantsApiRequest,
} from "./forest-plants-api-route";

describe("handleForestPlantsApiRequest", () => {
  it("returns plant stories from the cleaned CSV without requiring a public data key", async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    const response = await handleForestPlantsApiRequest(
      new Request("https://forest.test/api/forest-plants?searchWrd=무궁화&numOfRows=1"),
      {},
      fetchImpl,
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        totalCount: 1,
        resultCode: "CSV",
        items: [{ name: "무궁화", scientificName: "Hibiscus syriacus L." }],
      },
      cached: true,
    });
  });

  it("paginates the cleaned CSV list", async () => {
    const response = await handleForestPlantsApiRequest(
      new Request("https://forest.test/api/forest-plants?pageNo=1&numOfRows=2"),
      {},
      vi.fn<typeof fetch>(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        resultCode: "CSV",
        pageNo: 1,
        numOfRows: 2,
      },
      cached: true,
    });
  });
});

describe("handleForestPlantImagesApiRequest", () => {
  it("returns an empty image list because the cleaned CSV has no image fields", async () => {
    const response = await handleForestPlantImagesApiRequest(
      new Request("https://forest.test/api/forest-plant-images?searchWrd=1&numOfRows=1"),
      {},
      vi.fn(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        resultCode: "NO_IMAGE_FIELDS",
        totalCount: 0,
        items: [],
      },
      cached: true,
    });
  });
});
