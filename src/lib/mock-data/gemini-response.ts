import type { RecommendationResult } from "@/types";
import { getMockFacilities } from "./facilities";
import { getMockNearbyPlaces } from "./tourism";

export function getMockRecommendation(facilityId = "f-001"): RecommendationResult {
  const facility = getMockFacilities().find((f) => f.id === facilityId) || getMockFacilities()[0];
  const now = new Date();

  return {
    id: `rec-${Date.now()}`,
    facility: {
      id: facility.id,
      name: facility.name,
      type: facility.type,
      address: facility.address,
      lat: facility.lat,
      lng: facility.lng,
      matchScore: 92,
      matchReason:
        "스트레스 완화와 편안한 걷기를 선호하시는 성향에 맞추어, 피톤치드 방출량이 많고 평탄한 숲길이 있는 이곳을 추천합니다.",
    },
    program: {
      title: "스트레스 해소 삼림욕 코스",
      totalDurationMinutes: 180,
      schedule: [
        {
          order: 1,
          time: "10:00",
          activity: "숲길 산책",
          type: "walking",
          location: "치유의 숲길 1코스",
          description: "피톤치드가 가장 많이 나오는 오전 시간대에 편안하게 걷습니다.",
          durationMinutes: 40,
        },
        {
          order: 2,
          time: "10:40",
          activity: "오감 숲 체험",
          type: "experience",
          location: "맨발 걷기 트랙",
          description: "신발을 벗고 맨발로 흙을 밟으며 자연과 교감합니다.",
          durationMinutes: 30,
        },
        {
          order: 3,
          time: "11:10",
          activity: "숲속 명상",
          type: "meditation",
          location: "잣나무림 명상데크",
          description: "자연의 소리에 집중하며 복식호흡으로 스트레스를 이완합니다.",
          durationMinutes: 50,
        },
        {
          order: 4,
          time: "12:00",
          activity: "건강 도시락 식사",
          type: "forest_bathing",
          location: "피크닉 존",
          description: "숲 속에서 여유롭게 도시락을 즐기며 휴식합니다.",
          durationMinutes: 60,
        },
      ],
    },
    environment: {
      overallScore: "excellent",
      suitabilityScore: 95,
      weatherNote: "맑고 온화하여 산림욕에 최적의 날씨입니다.",
      airQualityNote: "미세먼지가 '좋음' 수준으로 호흡기 건강에 이롭습니다.",
      uvNote: "자외선이 높지 않아 장시간 야외 활동에 무리가 없습니다.",
      cautions: ["숲 속은 기온이 약간 낮을 수 있으니 얇은 겉옷을 챙겨주세요."],
      recommendation: "최상의 조건이므로 야외 명상과 맨발 걷기를 적극 권장합니다.",
    },
    expectedEffects: {
      primary: "스트레스 호르몬 코르티솔 약 35% 감소 예상",
      secondary: "부교감신경 활성화로 인한 수면 질 향상",
      note: "*산림청 국립산림과학원의 산림치유 효과 연구 결과에 기반한 추정치입니다.",
    },
    nearby: getMockNearbyPlaces(),
    createdAt: now,
  };
}

export function getMockRecommendationFamily(): RecommendationResult {
  const rec = getMockRecommendation("f-003"); // 국립횡성숲체원 (교육, 무장애)
  rec.facility.matchReason =
    "아이와 함께 걷기 좋은 무장애 데크로가 있으며, 다양한 숲 교육 프로그램이 준비되어 있어 가족 단위 방문에 적합합니다.";
  rec.program.title = "우리 가족 숲속 오감 탐험대";
  rec.program.schedule = [
    {
      order: 1,
      time: "14:00",
      activity: "가족 숲 탐험",
      type: "education",
      location: "늘솔길",
      description: "숲 해설가와 함께 숲의 동식물 이야기를 듣습니다.",
      durationMinutes: 60,
    },
    {
      order: 2,
      time: "15:00",
      activity: "나뭇잎 탁본 만들기",
      type: "experience",
      location: "체험장",
      description: "채집한 나뭇잎으로 가족만의 작품을 만듭니다.",
      durationMinutes: 40,
    },
    {
      order: 3,
      time: "15:40",
      activity: "가족 소통 명상",
      type: "meditation",
      location: "잔디광장",
      description: "서로에게 고마움을 전하는 짧은 명상 시간.",
      durationMinutes: 20,
    },
  ];
  return rec;
}
