import type { NearbyPlace } from "@/types";

export function getMockNearbyPlaces(): NearbyPlace[] {
  return [
    {
      type: "restaurant",
      name: "산채비빔밥 전문점 숲향",
      distance: "1.2km",
      description: "산지 직송 나물로 만든 건강한 한 끼",
    },
    {
      type: "cafe",
      name: "카페 포레스트",
      distance: "2.5km",
      description: "직접 로스팅한 커피와 통유리 숲 뷰",
    },
    {
      type: "restaurant",
      name: "단월 손두부",
      distance: "3.1km",
      description: "매일 아침 직접 빚은 촌두부 요리",
    },
    {
      type: "attraction",
      name: "단월 오일장 (5, 10일)",
      distance: "5.4km",
      description: "지역 특산물과 정겨운 시골장터",
    },
  ];
}
