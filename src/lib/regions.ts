type Region = {
  id: string;
  label: string;
  matchers?: string[];
};

export const REGIONS: Region[] = [
  { id: "all", label: "전국" },
  { id: "capital", label: "수도권", matchers: ["서울", "경기", "인천"] },
  { id: "gangwon", label: "강원권", matchers: ["강원"] },
  {
    id: "chungcheong",
    label: "충청권",
    matchers: ["충북", "충청북도", "충남", "충청남도", "대전", "세종"],
  },
  { id: "jeolla", label: "전라권", matchers: ["전북", "전라북도", "전남", "전라남도", "광주"] },
  {
    id: "gyeongsang",
    label: "경상권",
    matchers: ["경북", "경상북도", "경남", "경상남도", "부산", "대구", "울산"],
  },
  { id: "jeju", label: "제주권", matchers: ["제주"] },
];

export function matchesRegion(address: string, regionId: string): boolean {
  if (regionId === "all") return true;
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return true;

  const normalizedAddress = address.trim();
  return (region.matchers ?? []).some((matcher) => normalizedAddress.startsWith(matcher));
}
