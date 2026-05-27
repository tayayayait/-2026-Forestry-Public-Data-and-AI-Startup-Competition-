import type { PlantInfo } from "@/types";

export type PlantGuideItem = PlantInfo & {
  isFloweringNow: boolean;
  seasonLabel: string;
};

type PlantGuideInput = {
  plants: PlantInfo[];
  fallbackPlants: PlantInfo[];
  searchQuery: string;
  date: Date;
};

function parseFloweringMonths(seasonText: string | undefined): number[] {
  return [...(seasonText ?? "").matchAll(/(\d{1,2})\s*월/g)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((month) => month >= 1 && month <= 12);
}

function includesMonth(seasonText: string | undefined, month: number): boolean {
  const months = parseFloweringMonths(seasonText);
  if (months.length === 0) return false;
  if (months.length === 1) return months[0] === month;

  const [start, end] = months;
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

function getSeasonLabel(plant: PlantInfo, month: number): string {
  if (includesMonth(plant.floweringSeason, month)) return "이달 관찰";
  return plant.floweringSeason ?? "계절 정보 없음";
}

function toSearchText(plant: PlantInfo): string {
  return [
    plant.name,
    plant.scientificName,
    plant.description,
    plant.usage,
    plant.habitat,
    plant.floweringSeason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

function matchesSearch(plant: PlantInfo, query: string): boolean {
  if (!query) return true;
  return toSearchText(plant).includes(query.toLocaleLowerCase("ko-KR"));
}

export function buildPlantGuideItems({
  plants,
  fallbackPlants,
  searchQuery,
  date,
}: PlantGuideInput): PlantGuideItem[] {
  const month = date.getMonth() + 1;
  const source = plants.length > 0 ? plants : fallbackPlants;

  return source
    .filter((plant) => matchesSearch(plant, searchQuery.trim()))
    .map((plant) => ({
      ...plant,
      isFloweringNow: includesMonth(plant.floweringSeason, month),
      seasonLabel: getSeasonLabel(plant, month),
    }))
    .sort((left, right) => {
      if (left.isFloweringNow !== right.isFloweringNow) {
        return left.isFloweringNow ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "ko-KR");
    });
}
