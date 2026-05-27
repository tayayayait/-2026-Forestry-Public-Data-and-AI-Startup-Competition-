import { beforeEach, describe, expect, it } from "vitest";

import { useSurveyStore } from "./surveyStore";

describe("survey answer normalization", () => {
  beforeEach(() => {
    useSurveyStore.getState().reset();
  });

  it("stores maxTravelTime as a number even when the UI option value is a string", () => {
    useSurveyStore.getState().setAnswer("maxTravelTime", "60");

    expect(useSurveyStore.getState().answers.maxTravelTime).toBe(60);
  });
});
