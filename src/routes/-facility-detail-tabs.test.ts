import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailRouteSource = readFileSync(
  resolve(process.cwd(), "src/routes/facilities/$facilityId.tsx"),
  "utf8",
);
const detailTabsSource = readFileSync(
  resolve(process.cwd(), "src/components/forest/DetailTabs.tsx"),
  "utf8",
);

describe("facility detail tabs", () => {
  it("uses document-relative section positions for tab scrolling", () => {
    expect(detailRouteSource).toContain('DETAIL_SCROLL_CONTAINER_ID = "main-content"');
    expect(detailRouteSource).toContain("getDetailScrollContainer");
    expect(detailRouteSource).toContain("container.scrollHeight > container.clientHeight + 1");
    expect(detailRouteSource).toContain("scrollContainer.scrollTo");
    expect(detailRouteSource).toContain("scrollContainer.scrollTop");
    expect(detailRouteSource).toContain("DETAIL_TAB_SCROLL_OFFSET");
    expect(detailRouteSource).toContain("DETAIL_TAB_ACTIVE_TOLERANCE");
    expect(detailRouteSource).toContain("getActiveTabFromScroll");
    expect(detailRouteSource).toContain("isAtPageBottom");
    expect(detailRouteSource).toContain("getScrollHeight");
  });

  it("links each tab to its controlled section", () => {
    expect(detailTabsSource).toContain("id={`facility-tab-${tab.id}`}");
    expect(detailTabsSource).toContain("aria-controls={`facility-section-${tab.id}`}");

    for (const tabId of ["intro", "usage", "photos", "transport"]) {
      expect(detailRouteSource).toContain(`id="facility-section-${tabId}"`);
      expect(detailRouteSource).toContain(`aria-labelledby="facility-tab-${tabId}"`);
    }
  });
});
