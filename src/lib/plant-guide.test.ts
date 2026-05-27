import { describe, expect, it } from "vitest";
import type { PlantInfo } from "@/types";
import { buildPlantGuideItems } from "./plant-guide";

const plants: PlantInfo[] = [
  {
    id: "pine",
    name: "소나무",
    scientificName: "Pinus densiflora",
    description: "사철 푸른 바늘잎나무",
    usage: "피톤치드가 풍부하여 산림욕에 적합합니다.",
    habitat: "전국 산지",
    floweringSeason: "5월",
  },
  {
    id: "hinoki",
    name: "편백나무",
    scientificName: "Chamaecyparis obtusa",
    description: "상록 침엽수",
    usage: "스트레스 완화와 항균 작용에 활용됩니다.",
    habitat: "남부 조림지",
    floweringSeason: "4월",
  },
];

describe("buildPlantGuideItems", () => {
  it("prioritizes plants flowering in the current month", () => {
    const items = buildPlantGuideItems({
      plants: [plants[1], plants[0]],
      fallbackPlants: [],
      searchQuery: "",
      date: new Date("2026-05-22T09:00:00+09:00"),
    });

    expect(items[0]).toMatchObject({
      id: "pine",
      isFloweringNow: true,
      seasonLabel: "이달 관찰",
    });
  });

  it("filters plants by name, scientific name, usage, and habitat", () => {
    expect(
      buildPlantGuideItems({
        plants,
        fallbackPlants: [],
        searchQuery: "피톤치드",
        date: new Date("2026-05-22T09:00:00+09:00"),
      }),
    ).toHaveLength(1);

    expect(
      buildPlantGuideItems({
        plants,
        fallbackPlants: [],
        searchQuery: "Chamaecyparis",
        date: new Date("2026-05-22T09:00:00+09:00"),
      })[0]?.id,
    ).toBe("hinoki");
  });

  it("uses fallback plants when remote data is empty", () => {
    const items = buildPlantGuideItems({
      plants: [],
      fallbackPlants: [plants[0]],
      searchQuery: "",
      date: new Date("2026-05-22T09:00:00+09:00"),
    });

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("pine");
  });
});
