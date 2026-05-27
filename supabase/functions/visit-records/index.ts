import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("visit_records")
        .select("*")
        .eq("user_id", user.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      const { data, error } = await supabase
        .from("visit_records")
        .insert({
          user_id: user.id,
          recommendation_id: body.recommendationId,
          facility_name: body.facilityName,
          visit_date: body.visitDate,
          duration_minutes: body.durationMinutes,
          activities: body.activities,
          pre_stress: body.preStress,
          post_stress: body.postStress,
          pre_sleep: body.preSleep,
          post_sleep: body.postSleep,
          mood_change: body.moodChange,
          memo: body.memo,
          photos: body.photos,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) throw new Error("id required");

      const { data, error } = await supabase
        .from("visit_records")
        .update({
          duration_minutes: body.durationMinutes,
          activities: body.activities,
          post_stress: body.postStress,
          post_sleep: body.postSleep,
          mood_change: body.moodChange,
          memo: body.memo,
          photos: body.photos,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) throw new Error("id required");

      const { error } = await supabase
        .from("visit_records")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
