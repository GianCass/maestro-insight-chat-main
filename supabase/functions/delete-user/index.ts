import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

// Declare Deno to avoid TS errors in non-Deno tooling; Deno provides this at runtime.
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

  // Use standard Supabase env var names inside Edge Functions
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: userErr?.message || "User not found" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = userData.user.id;

    // 1. Delete all user data (messages -> chats -> profile) before removing auth user
    // 1.a Find all chat ids for this user
    const { data: chatRows, error: chatsErr } = await supabaseAdmin
      .from("chats")
      .select("id")
      .eq("user_id", userId);
    if (chatsErr) throw chatsErr;

    const chatIds = (chatRows ?? []).map((c: { id: string }) => c.id);

    // 1.b Delete messages for those chats (if any)
    if (chatIds.length > 0) {
      const { error: msgErr } = await supabaseAdmin
        .from("messages")
        .delete()
        .in("chat_id", chatIds);
      if (msgErr) throw msgErr;
    }

    // 1.c Delete chats for this user
    const { error: delChatsErr } = await supabaseAdmin
      .from("chats")
      .delete()
      .eq("user_id", userId);
    if (delChatsErr) throw delChatsErr;

    // 1.d Delete profile
    const { error: profileErr } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileErr) throw profileErr;

    // 2. Delete auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
