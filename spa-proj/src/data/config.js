// src/data/config.js
import { supabase } from "../utils/supabaseClient";

/** Local fallback if DB is unreachable */
const FALLBACK = {
  name: "Serenity Spa",
  phone: "(555) 123-RELAX",
  email: "hello@serenityspa.com",
  address: "123 Wellness Boulevard, Serenity District, SD 12345",
  hours: { mon_fri: "09:00 – 19:00", sat: "10:00 – 18:00", sun: "Closed" },
  policies: {
    cancellation: "We kindly ask for 24 hours notice to cancel or reschedule.",
    late: "Arrivals more than 15 minutes late may require reduced treatment time.",
  },
};

// ✅ define _cache at the top so it’s in scope
let _cache = null;

export async function fetchBusinessConfig() {
  if (_cache) {
    console.log("[fetchBusinessConfig] Returning cached config");
    return _cache;
  }

  console.log(
    "[fetchBusinessConfig] Fetching business config from Supabase..."
  );
  const { data, error } = await supabase
    .from("business_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("[fetchBusinessConfig] Error:", error);
    _cache = FALLBACK;
    return _cache;
  }

  console.log("[fetchBusinessConfig] Received:", data);

  _cache = {
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    hours: data.hours,
    policies: data.policies,
  };
  return _cache;
}

export { FALLBACK as BUSINESS_CONFIG_FALLBACK };
