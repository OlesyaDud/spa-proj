// scripts/embed-kb.mjs
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

async function main() {
  let total = 0;
  for (;;) {
    const { data: rows, error } = await supa
      .from("knowledge")
      .select("id, chunk")
      .is("embedding", null)
      .limit(BATCH);

    if (error) throw error;
    if (!rows?.length) break;

    const inputs = rows.map((r) => (r?.chunk ?? "").slice(0, 8000));
    const resp = await openai.embeddings.create({
      model: MODEL,
      input: inputs,
    });

    // update each row (no inserts)
    for (let i = 0; i < rows.length; i++) {
      const id = rows[i].id;
      const embedding = resp.data[i].embedding;
      const { error: upErr } = await supa
        .from("knowledge")
        .update({ embedding })
        .eq("id", id);
      if (upErr) throw upErr;
    }

    total += rows.length;
    console.log(`Embedded ${total} rows so far…`);
  }
  console.log("✅ Done embedding all rows.");
}

main().catch((e) => {
  console.error("❌ Embed error:", e);
  process.exit(1);
});
