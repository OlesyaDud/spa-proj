// src/utils/aiChat.js
const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL;

function normalizeContent(reply) {
  if (!reply) return "";
  const c = reply.content;
  if (typeof c === "string") return c;

  if (Array.isArray(c)) {
    return c
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        if (part.type === "text" && typeof part.text === "string")
          return part.text;
        if (part.text && typeof part.text.value === "string")
          return part.text.value;
        return "";
      })
      .join("\n")
      .trim();
  }

  if (c && typeof c === "object" && typeof c.text === "string") return c.text;
  return "";
}

export async function askAssistant(messages, system, options = {}) {
  const body = {
    messages,
    system,
    // Gentler retrieval by default; override per-call if needed
    rag_top_k: options.topK ?? 8,
    rag_threshold: options.threshold ?? 0.55,
  };

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    console.error("Edge function non-JSON response:", res.status, text);
    throw new Error(`Edge function failed (${res.status})`);
  }

  if (!res.ok) {
    console.error("Edge function error:", res.status, data);
    throw new Error(data?.error || `Edge function failed (${res.status})`);
  }

  const content = normalizeContent(data.reply);
  return {
    content,
    conversationId: data.conversation_id || data.conversationId || null,
    citations: data.citations || [],
  };
}
