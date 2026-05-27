import { createClient } from "@supabase/supabase-js";
import type { CategorizedImage } from "@/types";

type RuntimeEnv = {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type FacilityImageCurationRow = {
  facility_id: string;
  facility_name: string;
  images: CategorizedImage[];
};

export type FacilityImageCurationStore = {
  read: (facilityId: string) => Promise<CategorizedImage[] | null>;
  write: (input: {
    facilityId: string;
    facilityName: string;
    images: CategorizedImage[];
  }) => Promise<void>;
};

function cleanSecret(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
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

export function createFacilityImageCurationStore(env: unknown): FacilityImageCurationStore | null {
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
    async read(facilityId) {
      const { data, error } = await supabase
        .from("facility_image_curations")
        .select("images")
        .eq("facility_id", facilityId)
        .maybeSingle();

      if (error) throw error;

      const images = (data as Pick<FacilityImageCurationRow, "images"> | null)?.images;
      return Array.isArray(images) ? images : null;
    },

    async write({ facilityId, facilityName, images }) {
      const { error } = await supabase.from("facility_image_curations").upsert(
        {
          facility_id: facilityId,
          facility_name: facilityName,
          images,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "facility_id" },
      );

      if (error) throw error;
    },
  };
}
