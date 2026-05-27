import { describe, expect, it, vi } from "vitest";

import {
  buildTourApiLocationUrl,
  fetchNearbyTourismPlaces,
  normalizeTourApiLocationResponse,
} from "./tourapi";

const successPayload = {
  response: {
    header: {
      resultCode: "0000",
      resultMsg: "OK",
    },
    body: {
      items: {
        item: [
          {
            contentid: "1",
            contenttypeid: "39",
            title: "Forest Cafe",
            addr1: "Gangwon Forest Road",
            dist: "1200",
            firstimage: "https://example.com/cafe.jpg",
            mapx: "128.1234",
            mapy: "37.1234",
            lclsSystm1: "FD",
            lclsSystm2: "FD05",
            lclsSystm3: "FD050100",
            tel: "033-000-0000",
          },
          {
            contentid: "2",
            contenttypeid: "12",
            title: "Forest Valley",
            addr1: "Valley Road",
            dist: "850",
            mapx: "128.12",
            mapy: "37.12",
            lclsSystm1: "NA",
            lclsSystm2: "NA01",
          },
        ],
      },
      numOfRows: 2,
      pageNo: 1,
      totalCount: 2,
    },
  },
};

describe("buildTourApiLocationUrl", () => {
  it("builds a TourAPI locationBasedList2 URL for WGS84 coordinates", () => {
    const urlString = buildTourApiLocationUrl({
      serviceKey: "decoded-key",
      lat: 37.1234,
      lng: 128.1234,
      radius: 5000,
      contentTypeId: "39",
      lclsSystm1: "FD",
      lclsSystm2: "FD05",
      numOfRows: 3,
    });

    const url = new URL(urlString);

    expect(url.origin + url.pathname).toBe(
      "https://apis.data.go.kr/B551011/KorService2/locationBasedList2",
    );
    expect(url.searchParams.get("serviceKey")).toBe("decoded-key");
    expect(url.searchParams.get("MobileOS")).toBe("ETC");
    expect(url.searchParams.get("MobileApp")).toBe("ForestTherapyAI");
    expect(url.searchParams.get("_type")).toBe("json");
    expect(url.searchParams.get("arrange")).toBe("E");
    expect(url.searchParams.get("mapX")).toBe("128.1234");
    expect(url.searchParams.get("mapY")).toBe("37.1234");
    expect(url.searchParams.get("radius")).toBe("5000");
    expect(url.searchParams.get("contentTypeId")).toBe("39");
    expect(url.searchParams.get("lclsSystm2")).toBe("FD05");
  });
});

describe("normalizeTourApiLocationResponse", () => {
  it("normalizes TourAPI records into app nearby places", () => {
    expect(normalizeTourApiLocationResponse(successPayload)).toEqual({
      resultCode: "0000",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 2,
      totalCount: 2,
      items: [
        {
          type: "cafe",
          contentId: "1",
          contentTypeId: "39",
          name: "Forest Cafe",
          distance: "1.2km",
          description: "Gangwon Forest Road",
          imageUrl: "https://example.com/cafe.jpg",
          address: "Gangwon Forest Road",
          tel: "033-000-0000",
          lat: 37.1234,
          lng: 128.1234,
        },
        {
          type: "attraction",
          contentId: "2",
          contentTypeId: "12",
          name: "Forest Valley",
          distance: "850m",
          description: "Valley Road",
          address: "Valley Road",
          lat: 37.12,
          lng: 128.12,
        },
      ],
    });
  });

  it("throws the API result message for non-normal responses", () => {
    expect(() =>
      normalizeTourApiLocationResponse({
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

describe("fetchNearbyTourismPlaces", () => {
  it("fetches restaurant, cafe, and attraction candidates and deduplicates results", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json(successPayload));

    const places = await fetchNearbyTourismPlaces({
      serviceKey: "decoded-key",
      lat: 37.1234,
      lng: 128.1234,
      radius: 5000,
      numOfRows: 2,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0]![0].toString()).toContain("locationBasedList2");
    expect(places).toHaveLength(2);
    expect(places[0]!.name).toBe("Forest Valley");
    expect(places[1]!.name).toBe("Forest Cafe");
  });
});
