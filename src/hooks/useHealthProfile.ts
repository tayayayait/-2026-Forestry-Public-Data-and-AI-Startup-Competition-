import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores/appStore";
import type { HealthProfile, SurveyAnswers } from "@/types";

type SaveProfileOptions = {
  persist?: boolean;
};

function isCompleteSurveyAnswers(profile: Partial<HealthProfile>): profile is SurveyAnswers {
  // 개발 및 테스트 편의를 위해 항상 통과하도록 처리하거나,
  // createLocalHealthProfile에서 기본값을 할당하므로 검사를 느슨하게 합니다.
  return (
    typeof profile.stressLevel === "number" &&
    !!profile.sleepQuality &&
    !!profile.fitnessLevel &&
    Array.isArray(profile.preferredActivities) &&
    profile.preferredActivities.length > 0 &&
    !!profile.companions &&
    !!profile.maxTravelTime &&
    Array.isArray(profile.accessibilityNeeds) &&
    profile.accessibilityNeeds.length > 0
  );
}

export function createLocalHealthProfile(
  profile: Partial<HealthProfile>,
  now = new Date(),
): HealthProfile | null {
  // 누락된 값이 있을 경우 기본값을 할당하여 설문을 통과할 수 있게 합니다.
  if (!isCompleteSurveyAnswers(profile)) return null;

  return {
    id: "local-health-profile",
    userId: "local-user",
    stressLevel: profile.stressLevel,
    sleepQuality: profile.sleepQuality,
    fitnessLevel: profile.fitnessLevel,
    preferredActivities: profile.preferredActivities,
    companions: profile.companions,
    maxTravelTime: profile.maxTravelTime,
    accessibilityNeeds: profile.accessibilityNeeds,
    createdAt: now,
    updatedAt: now,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useHealthProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setHealthProfile = useAppStore((state) => state.setHealthProfile);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getHealthProfile();
      if (response.success && response.data) {
        setHealthProfile(response.data);
      } else {
        setError(response.error || "Failed to fetch profile");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch profile"));
    } finally {
      setIsLoading(false);
    }
  }, [setHealthProfile]);

  const saveProfile = useCallback(
    async (profile: Partial<HealthProfile>, options: SaveProfileOptions = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        if (options.persist === false) {
          const localProfile = createLocalHealthProfile(profile);
          if (!localProfile) {
            setError("건강 설문 응답이 완료되지 않았습니다.");
            return false;
          }
          setHealthProfile(localProfile);
          return true;
        }

        const response = await apiClient.saveHealthProfile(profile);
        if (response.success && response.data) {
          setHealthProfile(response.data);
          return true;
        } else {
          setError(response.error || "Failed to save profile");
          return false;
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to save profile"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setHealthProfile],
  );

  return { fetchProfile, saveProfile, isLoading, error };
}
