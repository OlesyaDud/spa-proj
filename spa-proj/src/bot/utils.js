// src/bot/utils.js

import {
  matchKB as kbGeneral,
  matchKBService as kbService,
} from "../bot/kb.js";

/** Format a Date into a friendly short string */
export const formatDate = (d) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d instanceof Date ? d : new Date(d));

/**
 * Try to answer using the knowledge base (services first, then general info).
 * Returns a string answer or null if no match.
 * NOTE: async — callers must `await tryKBAnswer(...)`.
 */
export async function tryKBAnswer(message) {
  // Service-specific (uses aliases + names from DB)
  const svc = await kbService(message);
  if (svc) return svc;

  // General business info (hours, address, policies, etc.)
  const gen = await kbGeneral(message);
  if (gen) return gen;

  return null;
}

/** Tiny regex-based intent detector used to steer the chat flow */
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
