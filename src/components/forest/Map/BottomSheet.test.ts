import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/forest/Map/BottomSheet.tsx"),
  "utf8",
);

describe("BottomSheet accessibility", () => {
  it("does not use a dialog-backed drawer for the persistent map facility list", () => {
    expect(source).not.toContain('from "vaul"');
    expect(source).not.toContain("<Drawer.Root");
    expect(source).toContain("<section");
    expect(source).toContain('aria-label="주변 치유 시설 목록"');
  });
});
