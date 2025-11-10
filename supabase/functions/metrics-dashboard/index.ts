import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

function buildCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  } as const;
}

serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = buildCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
    || Deno.env.get("VITE_SUPABASE_URL")
    || Deno.env.get("URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    || Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    // Optional: ensure the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Compute UTC day boundaries for today and yesterday
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    // All-time total messages
    const { count: totalAll, error: totalErr } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true });
    if (totalErr) throw totalErr;

    // Today's messages
    const { count: todayCount, error: todayErr } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());
    if (todayErr) throw todayErr;

    // Yesterday's messages
    const { count: yesterdayCount, error: yErr } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterdayStart.toISOString())
      .lt("created_at", todayStart.toISOString());
    if (yErr) throw yErr;

    let dailyChangePct = 0;
    const tVal = todayCount ?? 0;
    const yVal = yesterdayCount ?? 0;
    if (yVal > 0) {
      dailyChangePct = ((tVal - yVal) / yVal) * 100;
    } else {
      // Si ayer 0, multiplicar hoy * 100 (ej: hoy=2 => 200%)
      dailyChangePct = tVal > 0 ? tVal * 100 : 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalAll: totalAll ?? 0,
        todayCount: todayCount ?? 0,
        yesterdayCount: yesterdayCount ?? 0,
        dailyChangePct,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
