// @deno-types="https://deno.land/std@0.223.0/types.d.ts"
// @ts-nocheck

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const db =
  SUPABASE_URL && SERVICE_ROLE
    ? createClient(SUPABASE_URL, SERVICE_ROLE)
    : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method === "GET") {
      return new Response(JSON.stringify({ ok: true, name: "chat" }), {
        headers: jsonHeaders,
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST is allowed" }), {
        status: 405,
        headers: jsonHeaders,
      });
    }
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Bad JSON" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const {
      messages = [],
      system = "You are a friendly spa assistant.",
      conversation_id,
    } = body || {};

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "`messages` must be array" }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      );
    }

    // Determine last user message (to store)
    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Create conversation id on demand
    let convId = conversation_id ?? crypto.randomUUID();

    // Create conversation row if new (optional)
    if (db && !conversation_id) {
      await db.from("conversations").insert({ id: convId }).select().single();
    }

    // Store user's message
    if (db && lastUser) {
      await db.from("messages").insert({
        conversation_id: convId,
        role: "user",
        content: lastUser,
      });
    }

    // Call OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: system }, ...messages],
        temperature: 0.3,
      }),
    });

    const json = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify(json), {
        status: r.status,
        headers: jsonHeaders,
      });
    }

    const reply = json?.choices?.[0]?.message ?? {
      role: "assistant",
      content: "",
    };

    // Store assistant's message
    if (db) {
      await db.from("messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: reply.content ?? "",
      });
    }

    return new Response(JSON.stringify({ reply, conversation_id: convId }), {
      headers: jsonHeaders,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(e) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
