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
        .from("saved_courses")
        .select(
          `
          *,
          recommendations (*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (body.recommendationId) {
        const { data: existingCourse, error: existingError } = await supabase
          .from("saved_courses")
          .select(
            `
            *,
            recommendations (*)
          `,
          )
          .eq("user_id", user.id)
          .eq("recommendation_id", body.recommendationId)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existingCourse) {
          return new Response(JSON.stringify({ data: existingCourse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data, error } = await supabase
        .from("saved_courses")
        .insert({
          user_id: user.id,
          recommendation_id: body.recommendationId,
          title: body.title,
          facility_name: body.facilityName,
          memo: body.memo,
          is_bookmarked: body.isBookmarked ?? true,
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

      const updates: Record<string, unknown> = {};
      if ("title" in body) updates.title = body.title;
      if ("memo" in body) updates.memo = body.memo;
      if ("isBookmarked" in body) updates.is_bookmarked = body.isBookmarked;

      if (Object.keys(updates).length === 0) {
        throw new Error("No saved course fields to update");
      }

      const { data, error } = await supabase
        .from("saved_courses")
        .update(updates)
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
        .from("saved_courses")
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
