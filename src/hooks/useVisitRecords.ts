import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/stores/appStore";
import type { VisitRecord } from "@/types";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useVisitRecords() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setVisitHistory, addVisitRecord } = useAppStore((state) => state);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getVisitRecords();
      if (response.success && response.data) {
        setVisitHistory(response.data);
      } else {
        setError(response.error || "Failed to fetch visit records");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch visit records"));
    } finally {
      setIsLoading(false);
    }
  }, [setVisitHistory]);

  const createRecord = useCallback(
    async (record: Partial<VisitRecord>) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.saveVisitRecord(record);
        if (response.success && response.data) {
          addVisitRecord(response.data);
          return true;
        } else {
          setError(response.error || "Failed to save visit record");
          return false;
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to save visit record"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addVisitRecord],
  );

  return { fetchRecords, createRecord, isLoading, error };
}
