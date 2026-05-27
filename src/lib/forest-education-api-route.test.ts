import { describe, expect, it, vi } from "vitest";

import { handleForestEducationProgramsApiRequest } from "./forest-education-api-route";

const successXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
  <header><resultCode>0000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <title>숲해설 프로그램</title>
        <cont>내용</cont>
        <facnm>국립숲체원</facnm>
        <addr>강원특별자치도</addr>
        <mnagnnm>국립산림교육센터</mnagnnm>
        <tel>033-000-0000</tel>
      </item>
    </items>
    <numOfRows>1</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>1</totalCount>
  </body>
</response>`;

describe("handleForestEducationProgramsApiRequest", () => {
  it("returns normalized forest education programs when the server key exists", async () => {
    const fetchImpl = vi.fn(async () => new Response(successXml));

    const response = await handleForestEducationProgramsApiRequest(
      new Request("https://forest.test/api/forest-education-programs?eduType=1&numOfRows=1"),
      { FOREST_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        totalCount: 1,
        items: [
          {
            title: "숲해설 프로그램",
            facilityName: "국립숲체원",
            managementAgency: "국립산림교육센터",
          },
        ],
      },
      cached: false,
    });
  });

  it("attempts the live API for full-list requests before using fallback data", async () => {
    const fetchImpl = vi.fn(async () => new Response(successXml));

    const response = await handleForestEducationProgramsApiRequest(
      new Request("https://forest.test/api/forest-education-programs?eduType=4&numOfRows=1"),
      { FOREST_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        resultMsg: "OK",
        totalCount: 1,
      },
      cached: false,
    });
  });

  it("returns a non-throwing failure payload when the live API fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    const response = await handleForestEducationProgramsApiRequest(
      new Request(
        "https://forest.test/api/forest-education-programs?eduType=4&numOfRows=1&searchTitl=%EC%88%B2",
      ),
      { FOREST_SERVICE_KEY: "decoded-key" },
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "산림교육프로그램 API 연결에 실패했습니다.",
    });
  });

  it("rejects requests when no public-data service key is available", async () => {
    const response = await handleForestEducationProgramsApiRequest(
      new Request("https://forest.test/api/forest-education-programs"),
      {
        FOREST_SERVICE_KEY: "",
        PUBLIC_DATA_SERVICE_KEY: "",
        KMA_SERVICE_KEY: "",
        VITE_KMA_SERVICE_KEY: "",
      },
      vi.fn(),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    });
  });
});
