import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useSavedCourses() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getSavedCourses();
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || "Failed to fetch saved courses");
        return [];
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch saved courses"));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCourse = useCallback(
    async (courseData: Parameters<typeof apiClient.saveCourse>[0]) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.saveCourse(courseData);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || "Failed to save course");
          return null;
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to save course"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateCourse = useCallback(
    async (id: string, updates: Parameters<typeof apiClient.updateSavedCourse>[1]) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.updateSavedCourse(id, updates);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error || "Failed to update saved course");
          return null;
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to update saved course"));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteCourse = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.deleteSavedCourse(id);
      if (response.success) {
        return true;
      } else {
        setError(response.error || "Failed to delete saved course");
        return false;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete saved course"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchCourses, createCourse, updateCourse, deleteCourse, isLoading, error };
}
