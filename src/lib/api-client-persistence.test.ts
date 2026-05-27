import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiResponse, RecommendationResult } from "@/types";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

const { apiClient } = await import("./api-client");
const { getMockRecommendation } = await import("./mock-data");

describe("apiClient persistence mapping", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
  });

  it("maps a health profile database row to the app HealthProfile shape", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        data: {
          id: "profile-1",
          user_id: "user-1",
          stress_level: 8,
          sleep_quality: "poor",
          fitness_level: "beginner",
          preferred_activities: ["walking", "meditation"],
          companions: "solo",
          max_travel_time: 60,
          accessibility_needs: ["none"],
          created_at: "2026-05-21T01:00:00.000Z",
          updated_at: "2026-05-21T02:00:00.000Z",
        },
      },
      error: null,
    });

    const response = await apiClient.getHealthProfile();

    expect(mocks.invoke).toHaveBeenCalledWith("health-profile", { method: "GET" });
    expect(response.data).toMatchObject({
      id: "profile-1",
      userId: "user-1",
      stressLevel: 8,
      sleepQuality: "poor",
      fitnessLevel: "beginner",
      preferredActivities: ["walking", "meditation"],
      companions: "solo",
      maxTravelTime: 60,
      accessibilityNeeds: ["none"],
    });
    expect(response.data?.createdAt).toEqual(new Date("2026-05-21T01:00:00.000Z"));
    expect(response.data?.updatedAt).toEqual(new Date("2026-05-21T02:00:00.000Z"));
  });

  it("loads one persisted recommendation by id and maps database columns to RecommendationResult", async () => {
    const generated = getMockRecommendation("f-001");
    mocks.invoke.mockResolvedValue({
      data: {
        data: {
          id: "rec-db-1",
          facility_data: generated.facility,
          program_data: generated.program,
          environment_data: generated.environment,
          expected_effects: generated.expectedEffects,
          nearby_places: generated.nearby,
          created_at: "2026-05-21T03:00:00.000Z",
        },
      },
      error: null,
    });

    const response = await (
      apiClient as typeof apiClient & {
        getRecommendation: (id: string) => Promise<ApiResponse<RecommendationResult>>;
      }
    ).getRecommendation("rec-db-1");

    expect(mocks.invoke).toHaveBeenCalledWith("recommendations?id=rec-db-1", {
      method: "GET",
    });
    expect(response.data).toMatchObject({
      id: "rec-db-1",
      facility: generated.facility,
      program: generated.program,
      environment: generated.environment,
      expectedEffects: generated.expectedEffects,
      nearby: generated.nearby,
    });
    expect(response.data?.createdAt).toEqual(new Date("2026-05-21T03:00:00.000Z"));
  });

  it("maps visit record database rows to VisitRecord objects", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        data: [
          {
            id: "visit-1",
            user_id: "user-1",
            recommendation_id: "rec-1",
            facility_name: "Forest Center",
            visit_date: "2026-05-20",
            duration_minutes: 90,
            activities: ["walking"],
            pre_stress: 8,
            post_stress: 4,
            pre_sleep: "poor",
            post_sleep: "normal",
            mood_change: "calmer",
            memo: "good",
            photos: [],
            created_at: "2026-05-21T04:00:00.000Z",
          },
        ],
      },
      error: null,
    });

    const response = await apiClient.getVisitRecords();

    expect(response.data?.[0]).toMatchObject({
      id: "visit-1",
      userId: "user-1",
      recommendationId: "rec-1",
      facilityName: "Forest Center",
      durationMinutes: 90,
      preStress: 8,
      postStress: 4,
      preSleep: "poor",
      postSleep: "normal",
      moodChange: "calmer",
      memo: "good",
      photos: [],
    });
    expect(response.data?.[0]?.visitDate).toEqual(new Date("2026-05-20"));
    expect(response.data?.[0]?.createdAt).toEqual(new Date("2026-05-21T04:00:00.000Z"));
  });

  it("maps saved course database rows and preserves the nested recommendation", async () => {
    const generated = getMockRecommendation("f-001");
    mocks.invoke.mockResolvedValue({
      data: {
        data: [
          {
            id: "saved-1",
            user_id: "user-1",
            recommendation_id: "rec-db-1",
            title: "Morning course",
            facility_name: "Forest Center",
            memo: "bring water",
            is_bookmarked: true,
            created_at: "2026-05-21T05:00:00.000Z",
            recommendations: {
              id: "rec-db-1",
              facility_data: generated.facility,
              program_data: generated.program,
              environment_data: generated.environment,
              expected_effects: generated.expectedEffects,
              nearby_places: generated.nearby,
              created_at: "2026-05-21T03:00:00.000Z",
            },
          },
        ],
      },
      error: null,
    });

    const response = await apiClient.getSavedCourses();

    expect(response.data?.[0]).toMatchObject({
      id: "saved-1",
      userId: "user-1",
      recommendationId: "rec-db-1",
      title: "Morning course",
      facilityName: "Forest Center",
      memo: "bring water",
      isBookmarked: true,
      recommendation: {
        id: "rec-db-1",
        facility: generated.facility,
      },
    });
    expect(response.data?.[0]?.createdAt).toEqual(new Date("2026-05-21T05:00:00.000Z"));
  });

  it("updates a saved course by id and maps the updated row", async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        data: {
          id: "saved-1",
          user_id: "user-1",
          recommendation_id: "rec-db-1",
          title: "Updated course",
          facility_name: "Forest Center",
          memo: "bring a mat",
          is_bookmarked: false,
          created_at: "2026-05-21T05:00:00.000Z",
        },
      },
      error: null,
    });

    const response = await apiClient.updateSavedCourse("saved-1", {
      title: "Updated course",
      memo: "bring a mat",
      isBookmarked: false,
    });

    expect(mocks.invoke).toHaveBeenCalledWith("saved-courses?id=saved-1", {
      method: "PUT",
      body: {
        title: "Updated course",
        memo: "bring a mat",
        isBookmarked: false,
      },
    });
    expect(response.data).toMatchObject({
      id: "saved-1",
      title: "Updated course",
      memo: "bring a mat",
      isBookmarked: false,
    });
  });

  it("deletes a saved course by id", async () => {
    mocks.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const response = await apiClient.deleteSavedCourse("saved-1");

    expect(mocks.invoke).toHaveBeenCalledWith("saved-courses?id=saved-1", {
      method: "DELETE",
    });
    expect(response).toEqual({ success: true, data: true });
  });
});
