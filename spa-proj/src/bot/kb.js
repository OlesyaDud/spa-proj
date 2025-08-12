// src/data/kb.js
// Lightweight, local knowledge base.
// Later you can replace this with Supabase + embeddings.

import { BUSINESS_CONFIG } from "../data/config.js";
import { SERVICE_CATALOG } from "../data/services.js";

/** Normalize text for simple matching */
const norm = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Word-boundary test for single words; substring for multi-words */
function hits(text, term) {
  const t = norm(text);
  const q = norm(term);
  if (!q) return false;
  if (q.includes(" ")) return t.includes(q);
  return new RegExp(`\\b${q}\\b`, "i").test(t);
}

/* ---------- Service-specific KB ---------- */

const SERVICE_ALIASES = {
  massage: ["massage", "signature massage"],
  facial: ["facial", "facials", "rejuvenating facial"],
  "body-wrap": [
    "body wrap",
    "body wraps",
    "wrap",
    "wraps",
    "detox wrap",
    "detoxifying wrap",
    "detoxifying body wrap",
  ],
  aroma: ["aromatherapy", "aroma therapy", "aroma"],
  "hot-stone": [
    "hot stone",
    "hot stones",
    "hot stone therapy",
    "stone therapy",
  ],
  couples: ["couples", "couple", "couples massage", "couples retreat"],
};

function describeService(s) {
  return `${s.name}: ${s.description} (~${s.duration} minutes). Prices start at $${s.priceFrom}. Would you like me to book this for you?`;
}

export function matchKBService(text) {
  const t = norm(text);
  for (const [id, aliases] of Object.entries(SERVICE_ALIASES)) {
    if (aliases.some((a) => hits(t, a))) {
      const svc = SERVICE_CATALOG.find((x) => x.id === id);
      if (svc) return describeService(svc);
    }
  }
  return null;
}

/* ---------- General KB ---------- */

export const KNOWLEDGE_BASE = [
  {
    q: ["hours", "open", "opening", "close", "closing", "time", "schedule"],
    a: () =>
      `We're open Mon–Fri ${BUSINESS_CONFIG.hours.mon_fri}, Sat ${BUSINESS_CONFIG.hours.sat}, Sun ${BUSINESS_CONFIG.hours.sun}.`,
  },
  {
    q: ["location", "address", "where", "directions", "map"],
    a: () =>
      `You'll find us at ${BUSINESS_CONFIG.address}. Street and lot parking available nearby.`,
  },
  {
    q: ["contact", "phone", "email", "call", "reach"],
    a: () =>
      `Reach us at ${BUSINESS_CONFIG.phone} or ${BUSINESS_CONFIG.email}.`,
  },
  {
    q: ["cancel", "cancellation", "reschedul", "policy", "late"],
    a: () => BUSINESS_CONFIG.policies.cancellation,
  },
  {
    q: [
      "service",
      "services",
      "menu",
      "catalog",
      "list",
      "options",
      "pricing",
      "price",
      "cost",
      "how much",
      "rates",
    ],
    a: () =>
      `Popular options: ${SERVICE_CATALOG.map(
        (s) => `${s.name} (~${s.duration}m) from $${s.priceFrom}`
      ).join(
        "; "
      )}. Ask about any service for details, or say “book” to reserve.`,
  },

  // A few extra helpful items (optional but nice)
  {
    q: ["gift card", "giftcard", "voucher"],
    a: () => "Yes, we offer digital gift cards—email delivery within minutes.",
  },
  {
    q: ["payment", "pay", "card", "cash", "apple pay", "google pay"],
    a: () => "We accept major credit cards and contactless payments.",
  },
  {
    q: ["parking", "park"],
    a: () => "Street parking and a nearby public lot are available.",
  },
  {
    q: ["accessibility", "wheelchair", "accessible"],
    a: () =>
      "Our facility is wheelchair accessible. Let us know any accommodations you need.",
  },
  {
    q: ["arrive", "arrival", "early", "late"],
    a: () =>
      "Please arrive 10 minutes early to settle in. Late arrivals may reduce service time.",
  },
];

/** Match against general KB terms */
export function matchKB(text) {
  const t = norm(text);
  for (const item of KNOWLEDGE_BASE) {
    if (item.q.some((term) => hits(t, term))) {
      return item.a();
    }
  }
  return null;
}
