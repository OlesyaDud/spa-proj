// scripts/reembed-recent.mjs
import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const MODEL = "text-embedding-3-small";
const BATCH = 64;

// minutes to look back (cli arg wins, then env var, default 15)
const minutes = Number(process.argv[2] || process.env.REEMBED_MINUTES || 15);
const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

(async () => {
  console.log(
    `Re-embedding rows updated since ${cutoff} (last ${minutes} min)…`
  );

  // also fetch slug for sanity/debug; skip rows with empty chunks
  const { data: rows, error } = await supa
    .from("knowledge")
    .select("id, slug, chunk, updated_at")
    .or(`embedding.is.null,updated_at.gte.${cutoff}`)
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  const work = (rows || []).filter((r) => (r?.chunk || "").trim().length > 0);

  if (!work.length) {
    console.log("Nothing to re-embed.");
    process.exit(0);
  }

  let done = 0;
  for (let i = 0; i < work.length; i += BATCH) {
    const batch = work.slice(i, i + BATCH);
    const inputs = batch.map((r) => r.chunk.slice(0, 8000));

    const resp = await openai.embeddings.create({
      model: MODEL,
      input: inputs,
    });

    // Update each row (no insert possible)
    await Promise.all(
      batch.map(
        (r, idx) =>
          supa
            .from("knowledge")
            .update({ embedding: resp.data[idx].embedding })
            .eq("id", r.id) // <-- use your real PK column here
      )
    );

    done += batch.length;
    console.log(`Re-embedded ${done}/${work.length}`);
  }

  console.log("✅ Done.");
})().catch((e) => {
  console.error("❌ Re-embed error:", e);
  process.exit(1);
});
