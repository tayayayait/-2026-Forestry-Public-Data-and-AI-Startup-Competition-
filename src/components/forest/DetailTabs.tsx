import * as React from "react";

export type TabId = "intro" | "usage" | "photos" | "transport";

export interface DetailTab {
  id: TabId;
  label: string;
}

const DEFAULT_TABS: DetailTab[] = [
  { id: "intro", label: "소개" },
  { id: "usage", label: "이용안내" },
  { id: "photos", label: "사진" },
  { id: "transport", label: "교통정보" },
];

interface DetailTabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  tabs?: DetailTab[];
}

/**
 * 스티키(Sticky) 탭 네비게이션
 */
export function DetailTabs({ activeTab, onTabChange, tabs = DEFAULT_TABS }: DetailTabsProps) {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border-default bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl px-2" role="tablist" aria-label="상세 정보">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`facility-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-controls={`facility-section-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 cursor-pointer py-4 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 ${
                isActive ? "text-forest-700" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-t-full bg-forest-700" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
