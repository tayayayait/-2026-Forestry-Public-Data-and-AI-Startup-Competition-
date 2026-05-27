import { describe, expect, it, vi } from "vitest";

import { handleGeminiImageCurationApiRequest } from "./gemini-image-curation-api-route";
import type { CategorizedImage } from "@/types";

const imageBytes = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]);

const candidates: CategorizedImage[] = [
  {
    url: "https://images.test/forest.jpg",
    caption: "시설 전경",
    category: "scenery",
    source: "naver",
  },
  {
    url: "https://images.test/map.jpg",
    caption: "김대근 의장 일가 소유 부지",
    category: "scenery",
    source: "naver",
  },
];

describe("handleGeminiImageCurationApiRequest", () => {
  it("returns the pinned Supabase curation before downloading candidates or calling Gemini", async () => {
    const pinnedImages: CategorizedImage[] = [
      {
        url: "https://cdn.test/pinned.jpg",
        caption: "Pinned facility image",
        category: "scenery",
        source: "naver",
      },
    ];
    const store = {
      read: vi.fn(async () => pinnedImages),
      write: vi.fn(),
    };
    const fetchImpl = vi.fn<typeof fetch>();

    const response = await handleGeminiImageCurationApiRequest(
      new Request("https://forest.test/api/facility-image-curation", {
        method: "POST",
        body: JSON.stringify({
          facilityId: "healing-forest-busan",
          facilityName: "부산 치유의 숲",
          images: candidates,
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
      },
      fetchImpl,
      store,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      cached: true,
      data: pinnedImages,
    });
    expect(store.read).toHaveBeenCalledWith("healing-forest-busan");
    expect(store.write).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("saves successful Gemini curation results to the Supabase curation store", async () => {
    const store = {
      read: vi.fn(async () => null),
      write: vi.fn(async () => undefined),
    };
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = input.toString();

      if (url.includes("images.test")) {
        return new Response(imageBytes, {
          headers: {
            "content-type": "image/jpeg",
            "content-length": `${imageBytes.byteLength}`,
          },
        });
      }

      if (url.includes("generativelanguage.googleapis.com")) {
        const body = JSON.parse(String(init?.body));
        const parts = body.contents[0].parts;
        const ids = parts.flatMap((part: Record<string, unknown>) => {
          if (typeof part.text !== "string") return [];
          const match = part.text.match(/ID: (\d+)/);
          return match ? [Number.parseInt(match[1], 10)] : [];
        });

        return Response.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify(
                      ids.map((id) => ({
                        id,
                        accept: id === 0,
                        score: id === 0 ? 92 : 12,
                        category: id === 0 ? "scenery" : "reject",
                        reason: id === 0 ? "actual facility image" : "unrelated image",
                      })),
                    ),
                  },
                ],
              },
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const response = await handleGeminiImageCurationApiRequest(
      new Request("https://forest.test/api/facility-image-curation", {
        method: "POST",
        body: JSON.stringify({
          facilityId: "healing-forest-busan",
          facilityName: "부산 치유의 숲",
          images: candidates,
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
      },
      fetchImpl,
      store,
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      cached: false,
      data: [
        {
          url: "https://images.test/forest.jpg",
          category: "scenery",
        },
      ],
    });
    expect(store.write).toHaveBeenCalledWith({
      facilityId: "healing-forest-busan",
      facilityName: "부산 치유의 숲",
      images: payload.data,
    });
  });

  it("downloads image candidates and sends pixel data to Gemini as inlineData", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = input.toString();

      if (url.includes("images.test")) {
        return new Response(imageBytes, {
          headers: {
            "content-type": "image/jpeg",
            "content-length": `${imageBytes.byteLength}`,
          },
        });
      }

      if (url.includes("generativelanguage.googleapis.com")) {
        const body = JSON.parse(String(init?.body));
        const parts = body.contents[0].parts;
        const inlineParts = parts.filter((part: Record<string, unknown>) => "inlineData" in part);

        expect(inlineParts).toHaveLength(2);
        expect(inlineParts[0].inlineData).toMatchObject({
          mimeType: "image/jpeg",
          data: expect.any(String),
        });

        return Response.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify([
                      {
                        id: 0,
                        accept: true,
                        score: 92,
                        category: "scenery",
                        reason: "실제 숲 시설 전경",
                      },
                      {
                        id: 1,
                        accept: false,
                        score: 8,
                        category: "reject",
                        reason: "부지 관련 뉴스 이미지",
                      },
                    ]),
                  },
                ],
              },
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const response = await handleGeminiImageCurationApiRequest(
      new Request("https://forest.test/api/facility-image-curation", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "부산 치유의 숲",
          images: candidates,
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
      cached: false,
      data: [
        {
          url: "https://images.test/forest.jpg",
          category: "scenery",
        },
      ],
    });
  });

  it("falls back to the original candidates when the Gemini key is missing", async () => {
    const response = await handleGeminiImageCurationApiRequest(
      new Request("https://forest.test/api/facility-image-curation", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "부산 치유의 숲",
          images: candidates,
        }),
      }),
      { GEMINI_API_KEY: "" },
      vi.fn(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      cached: true,
      data: candidates,
      error: "GEMINI_API_KEY is not configured.",
    });
  });

  it("limits Gemini pixel analysis to the first 15 image candidates", async () => {
    const manyCandidates: CategorizedImage[] = Array.from({ length: 16 }, (_, index) => ({
      url: `https://images.test/image-${index}.jpg`,
      caption: `후보 ${index}`,
      category: "scenery",
      source: "naver",
    }));
    const imageFetchUrls: string[] = [];

    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = input.toString();

      if (url.includes("images.test")) {
        imageFetchUrls.push(url);
        return new Response(imageBytes, {
          headers: {
            "content-type": "image/jpeg",
            "content-length": `${imageBytes.byteLength}`,
          },
        });
      }

      if (url.includes("generativelanguage.googleapis.com")) {
        const body = JSON.parse(String(init?.body));
        const ids = body.contents[0].parts.flatMap((part: Record<string, unknown>) => {
          if (typeof part.text !== "string") return [];
          const match = part.text.match(/후보 이미지 ID: (\d+)/);
          return match ? [Number.parseInt(match[1], 10)] : [];
        });

        return Response.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify(
                      ids.map((id) => ({
                        id,
                        accept: true,
                        score: 90,
                        category: "scenery",
                        reason: "실제 시설 사진",
                      })),
                    ),
                  },
                ],
              },
            },
          ],
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const response = await handleGeminiImageCurationApiRequest(
      new Request("https://forest.test/api/facility-image-curation", {
        method: "POST",
        body: JSON.stringify({
          facilityName: "부산 치유의 숲",
          images: manyCandidates,
        }),
      }),
      {
        GEMINI_API_KEY: "secret-key",
      },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data).toHaveLength(15);
    expect(imageFetchUrls).toHaveLength(15);
    expect(imageFetchUrls).not.toContain("https://images.test/image-15.jpg");
  });
});
