// src/utils/aiChat.js
const FUNCTION_URL = import.meta.env.VITE_FUNCTION_URL;

// normalize content to a plain string (covers weird shapes)
function normalizeContent(reply) {
  if (!reply) return "";
  const c = reply.content;

  if (typeof c === "string") return c;

  // if a model ever returns array/parts, squeeze out text
  if (Array.isArray(c)) {
    const text = c
      .map((part) => {
        if (!part) return "";
        if (typeof part === "string") return part;
        // common shapes: { type: "text", text: "..." } or { text: { value: "..." } }
        if (part.type === "text" && typeof part.text === "string")
          return part.text;
        if (part.text && typeof part.text.value === "string")
          return part.text.value;
        return "";
      })
      .join("\n")
      .trim();
    return text;
  }

  if (c && typeof c === "object" && typeof c.text === "string") return c.text;

  return "";
}

export async function askAssistant(messages, system) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ messages, system }),
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

  // normalize to a plain string and also return the conversation id
  const content = normalizeContent(data.reply);
  return {
    content,
    conversationId: data.conversation_id || data.conversationId || null,
  };
}
