import type { FacilityType } from "@/types";

type FacilityCategoryStyle = {
  label: string;
  colorName: string;
  marker: string;
  markerBorder: string;
  softBg: string;
  softBorder: string;
  text: string;
  shadow: string;
};

export const FACILITY_CATEGORY_STYLES: Record<FacilityType | "all", FacilityCategoryStyle> = {
  all: {
    label: "전체 시설",
    colorName: "중립 회색",
    marker: "#334155",
    markerBorder: "#1e293b",
    softBg: "#f8fafc",
    softBorder: "#cbd5e1",
    text: "#334155",
    shadow: "rgba(51, 65, 85, 0.28)",
  },
  healing_forest: {
    label: "치유의숲",
    colorName: "숲 초록",
    marker: "#166534",
    markerBorder: "#14532d",
    softBg: "#dcfce7",
    softBorder: "#86efac",
    text: "#14532d",
    shadow: "rgba(22, 101, 52, 0.32)",
  },
  kids_forest: {
    label: "유아숲체험원",
    colorName: "새싹 민트",
    marker: "#0f9f7f",
    markerBorder: "#047857",
    softBg: "#d1fae5",
    softBorder: "#6ee7b7",
    text: "#065f46",
    shadow: "rgba(15, 159, 127, 0.3)",
  },
  recreation_forest: {
    label: "자연휴양림",
    colorName: "호수 파랑",
    marker: "#2563eb",
    markerBorder: "#1d4ed8",
    softBg: "#dbeafe",
    softBorder: "#93c5fd",
    text: "#1e3a8a",
    shadow: "rgba(37, 99, 235, 0.3)",
  },
  arboretum: {
    label: "수목원",
    colorName: "정원 금색",
    marker: "#d97706",
    markerBorder: "#92400e",
    softBg: "#fef3c7",
    softBorder: "#fbbf24",
    text: "#78350f",
    shadow: "rgba(217, 119, 6, 0.3)",
  },
  education: {
    label: "산림교육",
    colorName: "교육 보라",
    marker: "#7c3aed",
    markerBorder: "#5b21b6",
    softBg: "#ede9fe",
    softBorder: "#c4b5fd",
    text: "#4c1d95",
    shadow: "rgba(124, 58, 237, 0.3)",
  },
  traditional_village_forest: {
    label: "전통마을숲",
    colorName: "비활성 회갈색",
    marker: "#78716c",
    markerBorder: "#44403c",
    softBg: "#f5f5f4",
    softBorder: "#d6d3d1",
    text: "#44403c",
    shadow: "rgba(120, 113, 108, 0.28)",
  },
};

export const MAP_LEGEND_FACILITY_TYPES = [
  "healing_forest",
  "recreation_forest",
  "arboretum",
] as const;

export function getFacilityCategoryStyle(type: FacilityType | "all"): FacilityCategoryStyle {
  return FACILITY_CATEGORY_STYLES[type] ?? FACILITY_CATEGORY_STYLES.all;
}
