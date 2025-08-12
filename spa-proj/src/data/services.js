import { supabase } from "../utils/supabaseClient";

/** Just services (no aliases) */
export async function fetchServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("name");

  if (error) {
    console.error("[fetchServices] Error:", error);
    return [];
  }
  return data;
}

/** Services + aliases merged: [{ id, name, ..., aliases: ["hot stone", ...] }] */
export async function fetchServicesWithAliases() {
  // query both tables
  const [svcRes, aliasRes] = await Promise.all([
    supabase.from("services").select("*"),
    supabase.from("service_aliases").select("service_id, alias"),
  ]);

  if (svcRes.error) {
    console.error("[fetchServicesWithAliases] services error:", svcRes.error);
    return [];
  }
  if (aliasRes.error) {
    console.error("[fetchServicesWithAliases] aliases error:", aliasRes.error);
    // still return services (no aliases) if alias query fails
    return svcRes.data.map((r) => ({
      id: r.id,
      name: r.name,
      duration: r.duration,
      priceFrom: Number(r.price_from),
      description: r.description,
      aliases: [],
    }));
  }

  // group aliases by service_id
  const byService = new Map();
  for (const row of aliasRes.data) {
    const list = byService.get(row.service_id) || [];
    list.push(row.alias);
    byService.set(row.service_id, list);
  }

  // merge
  return svcRes.data.map((r) => ({
    id: r.id,
    name: r.name,
    duration: r.duration,
    priceFrom: Number(r.price_from),
    description: r.description,
    aliases: byService.get(r.id) || [],
  }));
}
