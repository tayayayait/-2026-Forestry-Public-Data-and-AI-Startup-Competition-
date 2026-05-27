import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const programsRouteSource = readFileSync(resolve(process.cwd(), "src/routes/programs.tsx"), "utf8");
const mapRouteSource = readFileSync(resolve(process.cwd(), "src/routes/map.tsx"), "utf8");

describe("forest education programs page removal", () => {
  it("redirects direct /programs access to the theme curation page", () => {
    expect(programsRouteSource).toContain('createFileRoute("/programs")');
    expect(programsRouteSource).toContain("redirect");
    expect(programsRouteSource).toContain('to: "/curation"');
  });

  it("does not render the forest education program search UI", () => {
    expect(programsRouteSource).not.toContain("useForestEducationPrograms");
    expect(programsRouteSource).not.toContain("ProgramCard");
    expect(programsRouteSource).not.toContain("searchTitl");
    expect(programsRouteSource).not.toContain("searchCont");
    expect(programsRouteSource).not.toContain("FALLBACK_DATA");
  });

  it("does not link the facility map to the removed program search screen", () => {
    expect(mapRouteSource).not.toContain('to="/programs"');
    expect(mapRouteSource).not.toContain("BookOpen");
  });
});
