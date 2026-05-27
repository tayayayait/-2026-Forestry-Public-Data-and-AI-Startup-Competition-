import { describe, expect, it } from "vitest";

import { formatBracketedSchedule } from "./UsageInfoSection";

describe("formatBracketedSchedule", () => {
  it("splits dense bracketed operating hours into readable lines", () => {
    expect(formatBracketedSchedule("[일일개장]09:00~18:00[숙박시설]15:00~익일 11:00")).toBe(
      "일일개장 09:00~18:00\n숙박시설 15:00~익일 11:00",
    );
  });

  it("keeps normal text unchanged", () => {
    expect(formatBracketedSchedule("입실 14:00 · 퇴실 11:00")).toBe("입실 14:00 · 퇴실 11:00");
  });
});
