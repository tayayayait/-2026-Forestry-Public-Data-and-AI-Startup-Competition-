import { describe, expect, it, vi } from "vitest";

import {
  buildBarrierFreeTourDetailUrl,
  enrichNearbyPlacesWithBarrierFreeAccessibility,
  fetchBarrierFreeTourAccessibility,
  normalizeBarrierFreeTourDetailResponse,
} from "./barrier-free-tourism";
import type { NearbyPlace } from "@/types";

const detailPayload = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: {
          contentid: "988449",
          parking: "장애인 주차장 있음",
          wheelchair: "대여가능(수동휠체어 2대)",
          exit: "주출입구는 경사로가 있어 휠체어 접근 가능함",
          elevator: "엘리베이터 있음",
          restroom: "장애인 화장실 있음",
          helpdog: "보조견 동반 가능",
          stroller: "유모차 대여 가능",
          lactationroom: "수유실 있음",
        },
      },
      numOfRows: 1,
      pageNo: 1,
      totalCount: 1,
    },
  },
};

describe("buildBarrierFreeTourDetailUrl", () => {
  it("builds a KorWithService2 detailWithTour2 URL", () => {
    const urlString = buildBarrierFreeTourDetailUrl({
      serviceKey: "decoded-key",
      contentId: "988449",
    });

    const url = new URL(urlString);

    expect(url.origin + url.pathname).toBe(
      "https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2",
    );
    expect(url.searchParams.get("serviceKey")).toBe("decoded-key");
    expect(url.searchParams.get("MobileOS")).toBe("ETC");
    expect(url.searchParams.get("MobileApp")).toBe("ForestTherapyAI");
    expect(url.searchParams.get("_type")).toBe("json");
    expect(url.searchParams.get("contentId")).toBe("988449");
  });
});

describe("normalizeBarrierFreeTourDetailResponse", () => {
  it("maps barrier-free detail fields to app accessibility flags", () => {
    expect(normalizeBarrierFreeTourDetailResponse(detailPayload)).toEqual({
      contentId: "988449",
      accessibility: {
        parking: true,
        wheelchair: true,
        restroom: true,
        elevator: true,
        helpdog: true,
        stroller: true,
      },
      notes: [
        "장애인 주차장 있음",
        "대여가능(수동휠체어 2대)",
        "주출입구는 경사로가 있어 휠체어 접근 가능함",
        "엘리베이터 있음",
        "장애인 화장실 있음",
        "보조견 동반 가능",
        "유모차 대여 가능",
        "수유실 있음",
      ],
    });
  });

  it("throws the API result message for non-normal responses", () => {
    expect(() =>
      normalizeBarrierFreeTourDetailResponse({
        response: {
          header: {
            resultCode: "30",
            resultMsg: "SERVICE KEY IS NOT REGISTERED ERROR.",
          },
        },
      }),
    ).toThrow("SERVICE KEY IS NOT REGISTERED ERROR.");
  });
});

describe("fetchBarrierFreeTourAccessibility", () => {
  it("fetches and normalizes detailWithTour2 data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(detailPayload));

    const detail = await fetchBarrierFreeTourAccessibility({
      serviceKey: "decoded-key",
      contentId: "988449",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![0].toString()).toContain("detailWithTour2");
    expect(detail.accessibility.wheelchair).toBe(true);
  });
});

describe("enrichNearbyPlacesWithBarrierFreeAccessibility", () => {
  it("adds accessibility flags to TourAPI places that have content IDs", async () => {
    const places: NearbyPlace[] = [
      {
        type: "attraction",
        contentId: "988449",
        name: "Accessible Bridge",
        distance: "1km",
      },
      {
        type: "restaurant",
        name: "No Content ID",
        distance: "2km",
      },
    ];
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(detailPayload));

    const enriched = await enrichNearbyPlacesWithBarrierFreeAccessibility(places, {
      serviceKey: "decoded-key",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(enriched[0]!.accessibility).toMatchObject({
      wheelchair: true,
      stroller: true,
      parking: true,
      restroom: true,
    });
    expect(enriched[1]!.accessibility).toBeUndefined();
  });
});
