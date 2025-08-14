// @deno-types="https://deno.land/std@0.223.0/types.d.ts"
// @ts-nocheck

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Secrets (supports either your new names or classic Supabase names)
 *   OPENAI_API_KEY
 *   SE_URL or SUPABASE_URL
 *   SE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY
 */
const OPENAI_API_KEY =
  Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_KEY");
const SUPABASE_URL = Deno.env.get("SE_URL") || Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE =
  Deno.env.get("SE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

/* ---------------- RAG helpers ---------------- */

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim

async function embed(text: string): Promise<number[] | null> {
  if (!text || !OPENAI_API_KEY) return null;
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.warn("[embed] error:", j);
    return null;
  }
  return j?.data?.[0]?.embedding ?? null;
}

/** Vector search via RPC */
async function retrieveMatches(
  query: string,
  opts?: { top_k?: number; threshold?: number }
): Promise<Array<{ title: string; chunk: string; similarity: number }>> {
  if (!db) return [];
  const queryEmbedding = await embed(query);
  if (!queryEmbedding) return [];

  const { top_k = 5, threshold = 0.72 } = opts || {};
  const { data, error } = await db.rpc("match_knowledge", {
    query_embedding: queryEmbedding,
    match_count: top_k,
    similarity_threshold: threshold,
  });

  if (error) {
    console.warn("[match_knowledge] error:", error);
    return [];
  }
  return (data || []).map((d: any) => ({
    title: d.title ?? d.slug ?? "kb",
    chunk: d.chunk,
    similarity: d.similarity,
  }));
}

function buildContextBlock(
  results: Array<{ title: string; chunk: string; similarity: number }>
) {
  if (!results?.length) return { context: "", citations: [] };
  const lines = results.map((r, i) => `【${i + 1}】 (${r.title})\n${r.chunk}`);
  return {
    context: lines.join("\n\n"),
    citations: results.map((r, i) => ({
      idx: i + 1,
      title: r.title,
      similarity: r.similarity,
    })),
  };
}

/** Build a tiny "Business Info" context from business_config to guarantee answers when RAG is empty. */
async function businessInfoContext() {
  if (!db) return "";
  const { data } = await db
    .from("business_config")
    .select("name,address,hours")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return "";
  const h = data.hours || {};
  const hoursLine = [
    h.mon_fri ? `Mon–Fri ${h.mon_fri}` : null,
    h.sat ? `Sat ${h.sat}` : null,
    h.sun ? `Sun ${h.sun}` : "Sun Closed",
  ]
    .filter(Boolean)
    .join(", ");
  return `Business Info:\nAddress: ${
    data.address || ""
  }\nHours: ${hoursLine}`.trim();
}

/* ---------------- HTTP handler ---------------- */

serve(async (req) => {
  try {
    if (req.method === "OPTIONS")
      return new Response("ok", { headers: corsHeaders });

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
      conversation_id,
      system = "You are a friendly spa assistant.",
      rag_top_k = 5,
      rag_threshold = 0.72,
    } = body || {};

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "`messages` must be array" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    let convId = conversation_id ?? crypto.randomUUID();

    if (db && !conversation_id) {
      try {
        await db.from("conversations").insert({ id: convId }).select().single();
      } catch (_) {}
    }
    if (db && lastUser) {
      try {
        await db
          .from("messages")
          .insert({ conversation_id: convId, role: "user", content: lastUser });
      } catch (_) {}
    }

    /* ---------- RAG retrieval ---------- */
    let context = "";
    let citations: any[] = [];

    if (lastUser) {
      // 1st pass
      let matches = await retrieveMatches(lastUser, {
        top_k: rag_top_k,
        threshold: rag_threshold,
      });

      // 2nd pass (softer) for short/underspecified questions like "Saturday hours"
      if (!matches.length) {
        const expanded =
          /\bhours?|open|opening|closing|saturday|weekend\b/i.test(lastUser)
            ? `${lastUser}. business hours schedule opening times`
            : /\b(address|where.*located|location|directions?)\b/i.test(
                lastUser
              )
            ? `${lastUser}. address location where located`
            : lastUser;
        matches = await retrieveMatches(expanded, {
          top_k: Math.max(8, rag_top_k),
          threshold: Math.min(0.5, rag_threshold),
        });
      }

      const ctx = buildContextBlock(matches);
      context = ctx.context;
      citations = ctx.citations;

      // If still no domain context, build a tiny Business Info fallback so the model can answer hours/address.
      if (!context && db) {
        const bizCtx = await businessInfoContext();
        if (bizCtx) context = `【BIZ】\n${bizCtx}`;
      }
    }

    const groundedSystem =
      `${system}\n\n` +
      `Answer using ONLY the context below. If the answer is not in the context, say you don't know and recommend contacting the spa.\n` +
      `Keep answers concise and accurate.\n\n` +
      `CONTEXT:\n${context || "(no domain context found)"}\n`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "system", content: groundedSystem }, ...messages],
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

    if (db) {
      try {
        await db.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: reply.content ?? "",
        });
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({ reply, conversation_id: convId, citations }),
      { headers: jsonHeaders }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Server error", detail: String(e) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
