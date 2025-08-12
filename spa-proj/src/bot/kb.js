// src/data/kb.js
// Lightweight, now reads services + business config from Supabase.

import { fetchBusinessConfig } from "../data/config.js";
import { fetchServicesWithAliases } from "../data/services.js";

const norm = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function hits(text, term) {
  const t = norm(text);
  const q = norm(term);
  if (!q) return false;
  if (q.includes(" ")) return t.includes(q);
  return new RegExp(`\\b${q}\\b`, "i").test(t);
}

function describeService(s) {
  return `${s.name}: ${s.description} (~${s.duration} minutes). Prices start at $${s.priceFrom}. Would you like me to book this for you?`;
}

// async: pulls services + aliases from DB
export async function matchKBService(text) {
  const t = norm(text);
  const items = await fetchServicesWithAliases(); // [{ id, name, duration, priceFrom, description, aliases: [] }]

  for (const s of items) {
    if (
      s.aliases?.some((a) => hits(t, a)) ||
      hits(t, s.name) ||
      hits(t, s.id)
    ) {
      return describeService(s);
    }
  }
  return null;
}

// async: also fetches business config from DB
export async function matchKB(text) {
  const t = norm(text);

  const [items, biz] = await Promise.all([
    fetchServicesWithAliases(),
    fetchBusinessConfig(),
  ]);

  const KNOWLEDGE_BASE = [
    {
      q: ["hours", "open", "opening", "close", "closing", "time", "schedule"],
      a: () =>
        `We're open Mon–Fri ${biz.hours.mon_fri}, Sat ${biz.hours.sat}, Sun ${biz.hours.sun}.`,
    },
    {
      q: ["location", "address", "where", "directions", "map"],
      a: () =>
        `You'll find us at ${biz.address}. Street and lot parking available nearby.`,
    },
    {
      q: ["contact", "phone", "email", "call", "reach"],
      a: () => `Reach us at ${biz.phone} or ${biz.email}.`,
    },
    {
      q: ["cancel", "cancellation", "reschedul", "policy", "late"],
      a: () => biz.policies.cancellation,
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
        `Popular options: ${items
          .map((s) => `${s.name} (~${s.duration}m) from $${s.priceFrom}`)
          .join(
            "; "
          )}. Ask about any service for details, or say “book” to reserve.`,
    },
    {
      q: ["gift card", "giftcard", "voucher"],
      a: () =>
        "Yes, we offer digital gift cards—email delivery within minutes.",
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

  for (const item of KNOWLEDGE_BASE) {
    if (item.q.some((term) => hits(t, term))) return item.a();
  }
  return null;
}
