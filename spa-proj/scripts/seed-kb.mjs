// scripts/seed-kb.mjs
// Node 18+ required (has fetch built-in)

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""; // optional

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
const KB_PATH = path.resolve("kb", "kb.md");

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function splitBySections(md) {
  const lines = md.split("\n");
  const out = [];
  let currentSlug = "serenity-spa-knowledge-base";
  let buf = [];

  for (const line of lines) {
    const m = line.match(/^##+\s+(.*)/); // '##', '###', etc.
    if (m) {
      if (buf.length)
        out.push({ slug: currentSlug, text: buf.join("\n").trim() });
      currentSlug = slugify(m[1]);
      buf = [];
    }
    buf.push(line);
  }
  if (buf.length) out.push({ slug: currentSlug, text: buf.join("\n").trim() });
  return out;
}

function chunk(text, max = 800) {
  const parts =
    text.match(new RegExp(`[\\s\\S]{1,${max}}(?=\\s|$)`, "g")) || [];
  return parts.map((p) => p.trim()).filter(Boolean);
}

async function embed(text) {
  if (!OPENAI_API_KEY) return null;
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.warn("Embedding error:", j);
    return null;
  }
  return j?.data?.[0]?.embedding ?? null;
}

async function main() {
  const md = await fs.readFile(KB_PATH, "utf8");
  const sections = splitBySections(md);

  const rows = [];
  for (const sec of sections) {
    const parts = chunk(sec.text, 800);
    for (let i = 0; i < parts.length; i++) {
      const slug = i === 0 ? sec.slug : `${sec.slug}-${pad(i + 1)}`;
      const e = await embed(parts[i]); // will be null if no OPENAI_API_KEY
      rows.push({ slug, chunk: parts[i], embedding: e });
    }
  }

  // insert in batches
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supa.from("knowledge").insert(batch);
    if (error) {
      console.error("Insert error:", error);
      process.exit(1);
    }
    console.log(`Inserted ${i + batch.length}/${rows.length}`);
  }

  console.log("Seeding complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
