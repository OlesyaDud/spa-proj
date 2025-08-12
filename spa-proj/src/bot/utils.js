// Bot helpers: date formatting, KB matcher, and a tiny regex-based intent detector
import { KNOWLEDGE_BASE } from "./kb.js";

export const formatDate = (d) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);

export const matchKB = (message) => {
  const msg = message.toLowerCase();
  for (const entry of KNOWLEDGE_BASE)
    if (entry.q.some((kw) => msg.includes(kw))) return entry.a();
  return null;
};

// src/bot/utils.js
export function detectIntent(input = "") {
  const s = String(input).toLowerCase();

  // greeting: match whole words only
  if (
    /\b(hi|hello|hey|hiya|howdy|good\s*(morning|afternoon|evening))\b/.test(s)
  )
    return "greeting";

  // services / pricing
  if (
    /\b(price|prices|pricing|cost|rate|how\s*much|fee|fees)\b/.test(s) ||
    /\b(service|services|menu|catalog|list|options)\b/.test(s)
  )
    return "price";

  // hours
  if (/\b(hours?|open|opening|close|closing|time|schedule)\b/.test(s))
    return "hours";

  // location / directions
  if (/\b(where|address|located|location|directions|map)\b/.test(s))
    return "location";

  // policies
  if (
    /\b(cancel|cancellation|policy|policies|reschedule|late|deposit)\b/.test(s)
  )
    return "policy";

  // booking
  if (/\b(book|booking|appointment|reserve|schedule)\b/.test(s)) return "book";

  return null;
}
