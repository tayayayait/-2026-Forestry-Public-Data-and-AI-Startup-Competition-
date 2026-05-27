import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchForestPlantImages,
  normalizeForestPlantsCsv,
  toPlantInfoList,
} from "./forest-plants";
import { fetchForestPlants } from "./forest-plants-csv.server";

const csvFixture = `숲이야기순번,구분,식물명,영문명,안내,학명,식물분류군명,서식장소,식물의일생,식물이야기설명,식물자료제공,등록일
1,목본류,가래나무,,쌍떡잎식물 가래나무목 : 가래나무과의 낙엽활엽 교목,Juglans mandshurica Maxim.,가래나무과,깊은 산속,높이가 20m 정도이다.,간혹 산에 가면 잎 달린 줄기들이 쭉쭉 올라가 시원한 느낌을 줍니다.,단양국유림관리소,09/07/10
35,목본류,무궁화,,쌍떡잎식물 아욱목 : 아욱과의 낙엽관목,Hibiscus syriacus L.,아욱과,정원,꽃은 7~10월에 핀다.,무궁무진하게 꽃이 핀다 하여 무궁화로 불리며 근화라고도 합니다.,단양국유림관리소,09/07/10
102,초본류,갈대,"Common Reed, Carrizo",외떡잎식물 벼목 : 벼과의 여러해살이풀,Phragmites communis Trin.,벼과,"습지, 물가",줄기의 마디가 있다.,갈대는 줄여서 갈이라고도 하며 한자로는 노 또는 위라고 합니다.,단양국유림관리소,09/07/10`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeForestPlantsCsv", () => {
  it("normalizes the cleaned Forest Service CSV into plant stories", () => {
    expect(normalizeForestPlantsCsv(csvFixture)).toEqual({
      resultCode: "CSV",
      resultMsg: "OK",
      pageNo: 1,
      numOfRows: 3,
      totalCount: 3,
      items: [
        {
          id: "1",
          category: "목본류",
          name: "가래나무",
          englishName: undefined,
          guide: "쌍떡잎식물 가래나무목 : 가래나무과의 낙엽활엽 교목",
          scientificName: "Juglans mandshurica Maxim.",
          className: "가래나무과",
          habitat: "깊은 산속",
          lifetime: "높이가 20m 정도이다.",
          story: "간혹 산에 가면 잎 달린 줄기들이 쭉쭉 올라가 시원한 느낌을 줍니다.",
          offer: "단양국유림관리소",
          registeredAt: "09/07/10",
        },
        expect.objectContaining({
          id: "35",
          name: "무궁화",
          scientificName: "Hibiscus syriacus L.",
        }),
        expect.objectContaining({
          id: "102",
          name: "갈대",
          englishName: "Common Reed, Carrizo",
          habitat: "습지, 물가",
        }),
      ],
    });
  });
});

describe("fetchForestPlants", () => {
  it("loads the cleaned CSV instead of calling the public data API", async () => {
    const fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await fetchForestPlants({
      searchWrd: "무궁화",
      numOfRows: 1,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      resultCode: "CSV",
      totalCount: 1,
      items: [
        {
          name: "무궁화",
          scientificName: "Hibiscus syriacus L.",
        },
      ],
    });
    expect(response.items[0]?.story).toContain("무궁무진하게 꽃이 핀다");
  });

  it("filters by story, scientific name, class, habitat, and guide text", async () => {
    const response = await fetchForestPlants({
      searchWrd: "Phragmites communis",
      numOfRows: 1,
    });

    expect(response.totalCount).toBeGreaterThanOrEqual(1);
    expect(response.items[0]?.name).toBe("갈대");
  });

  it("paginates the CSV list when no search word is provided", async () => {
    const response = await fetchForestPlants({ pageNo: 2, numOfRows: 5 });

    expect(response.resultCode).toBe("CSV");
    expect(response.pageNo).toBe(2);
    expect(response.numOfRows).toBe(5);
    expect(response.items).toHaveLength(5);
    expect(response.totalCount).toBeGreaterThan(5);
  });
});

describe("toPlantInfoList", () => {
  it("maps plant story data to the app PlantInfo shape", () => {
    expect(toPlantInfoList(normalizeForestPlantsCsv(csvFixture))[0]).toEqual({
      id: "forest-plant-1",
      name: "가래나무",
      scientificName: "Juglans mandshurica Maxim.",
      description: "간혹 산에 가면 잎 달린 줄기들이 쭉쭉 올라가 시원한 느낌을 줍니다.",
      habitat: "깊은 산속",
      usage: "쌍떡잎식물 가래나무목 : 가래나무과의 낙엽활엽 교목",
      floweringSeason: "높이가 20m 정도이다.",
    });
  });
});

describe("fetchForestPlantImages", () => {
  it("returns an empty image list because the cleaned CSV has no image fields", async () => {
    const response = await fetchForestPlantImages({
      searchWrd: "1",
    });

    expect(response).toMatchObject({
      resultCode: "NO_IMAGE_FIELDS",
      totalCount: 0,
      items: [],
    });
  });
});
