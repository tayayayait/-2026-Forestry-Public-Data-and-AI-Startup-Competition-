import { describe, expect, it, vi } from "vitest";

import {
  buildForestEducationProgramsUrl,
  fetchForestEducationPrograms,
  normalizeForestEducationProgramsXml,
} from "./forest-education";

const successXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
  <header>
    <resultCode>0000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <title>(호남권) 경암근린공원 유아숲체험원</title>
        <cont>숲 체험 프로그램 내용</cont>
        <rgdt>2026-03-06</rgdt>
        <rgter>산림청</rgter>
        <post>산림교육 담당부서</post>
        <facnm>경암근린공원 유아숲체험원</facnm>
        <addr>광주광역시 광산구 하남대로54번안길 133</addr>
        <category>유아숲교육</category>
        <period>연중</period>
        <mnagnnm>광주광역시</mnagnnm>
        <tel>062-960-8677</tel>
      </item>
    </items>
    <numOfRows>1</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>34</totalCount>
  </body>
</response>`;

describe("buildForestEducationProgramsUrl", () => {
  it("builds the Forest Service education program request", () => {
    const url = buildForestEducationProgramsUrl({
      serviceKey: "decoded-key",
      eduType: "1",
      searchTitl: "숲",
      pageNo: 2,
      numOfRows: 20,
    });

    const parsed = new URL(url);

    expect(url).toContain(
      "http://api.forest.go.kr/openapi/service/cultureInfoService/frstEduInfoOpenAPI",
    );
    expect(parsed.searchParams.get("ServiceKey")).toBe("decoded-key");
    expect(parsed.searchParams.get("serviceKey")).toBeNull();
    expect(parsed.searchParams.get("eduType")).toBe("1");
    expect(parsed.searchParams.get("searchTitl")).toBe("숲");
    expect(parsed.searchParams.get("pageNo")).toBe("2");
    expect(parsed.searchParams.get("numOfRows")).toBe("20");
  });

  it("preserves trailing service key padding for the Forest Service endpoint", () => {
    const url = buildForestEducationProgramsUrl({
      serviceKey: '"abc=="',
      pageNo: 1,
      numOfRows: 1,
    });

    expect(url).toContain("ServiceKey=abc==&");
    expect(url).not.toContain("ServiceKey=abc%3D%3D");
  });
});

describe("normalizeForestEducationProgramsXml", () => {
  it("normalizes Forest Service XML into app data", () => {
    expect(normalizeForestEducationProgramsXml(successXml)).toEqual({
      resultCode: "0000",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 1,
      totalCount: 34,
      items: [
        {
          title: "(호남권) 경암근린공원 유아숲체험원",
          content: "숲 체험 프로그램 내용",
          registeredAt: "2026-03-06",
          registrar: "산림청",
          department: "산림교육 담당부서",
          facilityName: "경암근린공원 유아숲체험원",
          address: "광주광역시 광산구 하남대로54번안길 133",
          category: "유아숲교육",
          period: "연중",
          managementAgency: "광주광역시",
          tel: "062-960-8677",
        },
      ],
    });
  });

  it("uses facility fields as the display title when eduType 4 omits title and content", () => {
    expect(
      normalizeForestEducationProgramsXml(`
        <response>
          <header><resultCode>0000</resultCode><resultMsg>OK</resultMsg></header>
          <body>
            <items>
              <item>
                <facnm>국립두타산자연휴양림</facnm>
                <addr>강원도 평창군 진부면 아차골길 132</addr>
                <category>관찰, 체험</category>
                <period>4~10월</period>
                <mnagnnm>국립자연휴양림관리소</mnagnnm>
                <tel>033-334-8815</tel>
              </item>
            </items>
            <numOfRows>1</numOfRows>
            <pageNo>1</pageNo>
            <totalCount>213</totalCount>
          </body>
        </response>
      `).items[0],
    ).toMatchObject({
      title: "국립두타산자연휴양림",
      content: "",
      facilityName: "국립두타산자연휴양림",
    });
  });

  it("throws the API result message for non-normal responses", () => {
    expect(() =>
      normalizeForestEducationProgramsXml(`
        <response>
          <header>
            <resultCode>30</resultCode>
            <resultMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</resultMsg>
          </header>
          <body />
        </response>
      `),
    ).toThrow("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });

  it("rejects non-XML fallback pages instead of treating them as empty results", () => {
    expect(() =>
      normalizeForestEducationProgramsXml(`
        <HTML>
          <HEAD><TITLE>openapi</TITLE></HEAD>
          <BODY>
            <script>
              document.location.href="/pubc/pubr/cmm/CMPubrHome/viewCMPubrHome.do";
            </script>
          </BODY>
        </HTML>
      `),
    ).toThrow("산림교육프로그램 API가 XML 응답을 반환하지 않았습니다.");
  });
});

describe("fetchForestEducationPrograms", () => {
  it("fetches and normalizes education programs", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(successXml));

    const response = await fetchForestEducationPrograms({
      serviceKey: "decoded-key",
      eduType: "1",
      numOfRows: 1,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![0].toString()).toContain("frstEduInfoOpenAPI");
    expect(response.resultCode).toBe("0000");
    expect(response.totalCount).toBe(34);
    expect(response.items[0]!).toMatchObject({
      title: "(호남권) 경암근린공원 유아숲체험원",
      tel: "062-960-8677",
    });
  });

  it("reports a clear error when the Forest Service endpoint cannot be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      fetchForestEducationPrograms({
        serviceKey: "decoded-key",
        eduType: "4",
        fetchImpl,
      }),
    ).rejects.toThrow("산림교육프로그램 API 연결에 실패했습니다.");
  });
});
