import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readOptionalSource(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const plantsRoutePath = resolve(process.cwd(), "src/routes/plants.tsx");
const plantsApiRoutePath = resolve(process.cwd(), "src/routes/api/forest-plants.ts");
const plantImagesApiRoutePath = resolve(process.cwd(), "src/routes/api/forest-plant-images.ts");
const homeRouteSource = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");

describe("plant guide page wiring", () => {
  it("exposes a user-facing plant guide route", () => {
    const source = readOptionalSource(plantsRoutePath);

    expect(source).toContain('createFileRoute("/plants")');
    expect(source).toContain("usePlants");
    expect(source).toContain("usePlants(searchQuery)");
    expect(source).toContain("buildPlantGuideItems");
    expect(source).not.toContain("getMockPlants");
  });

  it("exposes the forest plant CSV route used by apiClient.getPlants", () => {
    const source = readOptionalSource(plantsApiRoutePath);

    expect(source).toContain('createFileRoute("/api/forest-plants")');
    expect(source).toContain("handleForestPlantsApiRequest");
  });

  it("exposes the forest plant image compatibility route used by apiClient.getPlantImages", () => {
    const source = readOptionalSource(plantImagesApiRoutePath);

    expect(source).toContain('createFileRoute("/api/forest-plant-images")');
    expect(source).toContain("handleForestPlantImagesApiRequest");
  });

  it("wires selected plant cards to CSV-backed detail display", () => {
    const source = readOptionalSource(plantsRoutePath);

    expect(source).toContain("selectedPlantId");
    expect(source).toContain("정제 CSV에는 이미지 필드가 없습니다.");
  });

  it("opens a real camera stream for direct capture instead of the gallery picker", () => {
    const source = readOptionalSource(plantsRoutePath);

    expect(source).toContain("navigator.mediaDevices.getUserMedia");
    expect(source).toContain("videoRef");
    expect(source).toContain("captureCameraPhoto");
    expect(source).not.toContain('capture="environment"');
  });

  it("does not render local example plant data when the plant CSV lookup fails", () => {
    const source = readOptionalSource(plantsRoutePath);

    expect(source).not.toContain("로컬 예시 데이터");
    expect(source).not.toContain("로컬 예시 식물");
  });

  it("links the home landing page to the plant guide", () => {
    expect(homeRouteSource).toContain('to="/plants"');
  });
});
