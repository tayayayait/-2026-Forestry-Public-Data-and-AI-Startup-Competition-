import { createClient } from "@supabase/supabase-js";
import type { FacilityHomepageAnalysis } from "@/types";

type RuntimeEnv = {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type FacilityHomepageAnalysisRow = {
  homepage_url: string;
  facility_name: string;
  analysis: FacilityHomepageAnalysis;
};

export type FacilityHomepageAnalysisStore = {
  read: (homepageUrl: string) => Promise<FacilityHomepageAnalysis | null>;
  write: (input: {
    homepageUrl: string;
    facilityName: string;
    analysis: FacilityHomepageAnalysis;
  }) => Promise<void>;
};

function cleanSecret(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function normalizeHomepageUrl(value: string): string {
  return new URL(value).toString();
}

function readSupabaseConfig(env: unknown): { url: string; serviceRoleKey: string } | null {
  const runtimeEnv = (env ?? {}) as RuntimeEnv;
  const url = cleanSecret(
    runtimeEnv.SUPABASE_URL ??
      runtimeEnv.VITE_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL,
  );
  const serviceRoleKey = cleanSecret(
    runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return url && serviceRoleKey ? { url, serviceRoleKey } : null;
}

export function createFacilityHomepageAnalysisStore(
  env: unknown,
): FacilityHomepageAnalysisStore | null {
  const config = readSupabaseConfig(env);
  if (!config) return null;

  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return {
    async read(homepageUrl) {
      const { data, error } = await supabase
        .from("facility_homepage_analyses")
        .select("analysis")
        .eq("homepage_url", normalizeHomepageUrl(homepageUrl))
        .maybeSingle();

      if (error) throw error;

      const analysis = (data as Pick<FacilityHomepageAnalysisRow, "analysis"> | null)?.analysis;
      return analysis && typeof analysis === "object" ? analysis : null;
    },

    async write({ homepageUrl, facilityName, analysis }) {
      const { error } = await supabase.from("facility_homepage_analyses").upsert(
        {
          homepage_url: normalizeHomepageUrl(homepageUrl),
          facility_name: facilityName,
          analysis,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "homepage_url" },
      );

      if (error) throw error;
    },
  };
}
