import { describe, expect, it, vi } from "vitest";

import {
  buildAirKoreaAirQualityUrl,
  buildAirKoreaStationListUrl,
  fetchAirKoreaAirQuality,
  findNearestAirKoreaSido,
  normalizeAirKoreaMeasurementItem,
  selectNearestAirKoreaStation,
} from "./airkorea";

const stationListResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
    body: {
      items: [
        {
          stationCode: "111123",
          stationName: "종로구",
          addr: "서울 종로구 종로35가길 19",
          mangName: "도시대기",
          dmX: "127.005028",
          dmY: "37.572025",
        },
        {
          stationCode: "111262",
          stationName: "강남구",
          addr: "서울 강남구 학동로",
          mangName: "도시대기",
          dmX: "127.047502",
          dmY: "37.517562",
        },
      ],
    },
  },
};

const measurementResponse = {
  response: {
    header: { resultCode: "00", resultMsg: "NORMAL_CODE" },
    body: {
      items: [
        {
          dataTime: "2026-05-21 15:00",
          stationName: "종로구",
          stationCode: "111123",
          mangName: "도시대기",
          pm10Value: "35",
          pm25Value: "18",
          o3Value: "0.043",
          khaiValue: "52",
          khaiGrade: "2",
          pm10Grade: "2",
          pm25Grade: "1",
        },
      ],
    },
  },
};

describe("findNearestAirKoreaSido", () => {
  it("selects the AirKorea sido name closest to the input coordinates", () => {
    expect(findNearestAirKoreaSido(37.5665, 126.978)).toMatchObject({
      sidoName: "서울",
    });
  });
});

describe("buildAirKoreaStationListUrl", () => {
  it("builds a JSON station list request documented by the data portal", () => {
    const urlString = buildAirKoreaStationListUrl({
      serviceKey: "decoded-key",
      addr: "서울",
    });

    const url = new URL(urlString);

    expect(url.toString()).toContain(
      "http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getMsrstnList",
    );
    expect(url.searchParams.get("returnType")).toBe("json");
    expect(url.searchParams.get("addr")).toBe("서울");
    expect(url.searchParams.get("ver")).toBeNull();
  });
});

describe("selectNearestAirKoreaStation", () => {
  it("uses dmX as longitude and dmY as latitude when the values match that order", () => {
    const station = selectNearestAirKoreaStation(
      stationListResponse.response.body.items,
      37.5665,
      126.978,
    );

    expect(station).toMatchObject({
      stationName: "종로구",
      stationCode: "111123",
      lng: 127.005028,
      lat: 37.572025,
    });
    expect(station.distanceKm).toBeLessThan(3);
  });

  it("also supports the data portal sample order where dmX is latitude and dmY is longitude", () => {
    const station = selectNearestAirKoreaStation(
      [
        {
          stationCode: "111123",
          stationName: "종로구",
          addr: "서울 종로구 종로35가길 19",
          mangName: "도시대기",
          dmX: "37.572025",
          dmY: "127.005028",
        },
      ],
      37.5665,
      126.978,
    );

    expect(station).toMatchObject({
      stationName: "종로구",
      stationCode: "111123",
      lng: 127.005028,
      lat: 37.572025,
    });
    expect(station.distanceKm).toBeLessThan(3);
  });
});

describe("buildAirKoreaAirQualityUrl", () => {
  it("builds a station realtime measurement request", () => {
    const urlString = buildAirKoreaAirQualityUrl({
      serviceKey: "decoded-key",
      stationName: "종로구",
    });

    const url = new URL(urlString);

    expect(url.toString()).toContain(
      "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty",
    );
    expect(url.searchParams.get("returnType")).toBe("json");
    expect(url.searchParams.get("dataTerm")).toBe("DAILY");
    expect(url.searchParams.get("ver")).toBe("1.3");
    expect(url.searchParams.get("stationName")).toBe("종로구");
  });
});

describe("normalizeAirKoreaMeasurementItem", () => {
  it("normalizes AirKorea pollutant values and grades", () => {
    expect(
      normalizeAirKoreaMeasurementItem(measurementResponse.response.body.items[0], {
        stationName: "종로구",
        stationCode: "111123",
        address: "서울 종로구 종로35가길 19",
        mangName: "도시대기",
        lat: 37.572025,
        lng: 127.005028,
        distanceKm: 2.39,
      }),
    ).toMatchObject({
      stationName: "종로구",
      stationCode: "111123",
      stationAddress: "서울 종로구 종로35가길 19",
      dataTime: "2026-05-21 15:00",
      pm10Value: 35,
      pm25Value: 18,
      o3Value: 0.043,
      khaiValue: 52,
      khaiGrade: 2,
      pm10Grade: 2,
      pm25Grade: 1,
    });
  });
});

describe("fetchAirKoreaAirQuality", () => {
  it("fetches nearest station first, then station realtime air quality", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(Response.json(stationListResponse))
      .mockResolvedValueOnce(Response.json(measurementResponse));

    const airQuality = await fetchAirKoreaAirQuality({
      lat: 37.5665,
      lng: 126.978,
      serviceKey: "decoded-key",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0].toString()).toContain("getMsrstnList");
    expect(fetchImpl.mock.calls[1][0].toString()).toContain("getMsrstnAcctoRltmMesureDnsty");
    expect(airQuality).toMatchObject({
      stationName: "종로구",
      pm10Value: 35,
      pm25Value: 18,
      khaiGrade: 2,
    });
  });

  it("throws a useful error when AirKorea returns a non-normal result code", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        response: {
          header: { resultCode: "30", resultMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" },
          body: {},
        },
      }),
    );

    await expect(
      fetchAirKoreaAirQuality({
        lat: 37.5665,
        lng: 126.978,
        serviceKey: "bad-key",
        fetchImpl,
      }),
    ).rejects.toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });
});
