import type { PlantInfo } from "@/types";

export function getMockPlants(): PlantInfo[] {
  return [
    {
      id: "p-001",
      name: "금낭화",
      scientificName: "Dicentra spectabilis",
      description: "봄에 피는 핑크빛 꽃으로, 주머니 모양의 독특한 형태가 특징입니다.",
      habitat: "산지의 돌무덤이나 계곡 주변",
      floweringSeason: "5월 - 6월",
    },
    {
      id: "p-002",
      name: "소나무",
      scientificName: "Pinus densiflora",
      description: "사철 푸른 바늘잎나무로 한국의 산림에서 가장 흔하게 볼 수 있습니다.",
      usage: "피톤치드가 풍부하여 산림욕에 적합합니다.",
      habitat: "전국 산지",
      floweringSeason: "5월",
    },
    {
      id: "p-003",
      name: "편백나무",
      scientificName: "Chamaecyparis obtusa",
      description: "비늘 모양의 잎이 달린 상록수로 피톤치드 방출량이 가장 많은 나무 중 하나입니다.",
      usage: "스트레스 완화, 항균 작용에 탁월한 효과가 있습니다.",
      habitat: "주로 남부지방 및 인공 조림지",
      floweringSeason: "4월",
    },
    {
      id: "p-004",
      name: "은방울꽃",
      scientificName: "Convallaria majalis",
      description: "작은 종 모양의 하얀 꽃이 조롱조롱 달리는 여러해살이풀입니다.",
      habitat: "산지의 숲 속 그늘",
      floweringSeason: "5월",
    },
  ];
}
