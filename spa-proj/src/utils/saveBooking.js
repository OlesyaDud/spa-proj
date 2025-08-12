// src/utils/saveBooking.js
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

/**
 * Send a booking to your Apps Script Web App.
 * - Uses Content-Type: text/plain to avoid CORS preflights.
 * - Treats any 2xx or opaque response as success.
 * - Tries to parse a JSON body like { ok: true } if present.
 */
export async function saveBooking(payload) {
  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // preflight-safe
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    // Read body for diagnostics (some deployments return JSON { ok: true })
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }

    // If the body is JSON with { ok: true }, consider it success.
    let jsonOk = false;
    try {
      const j = JSON.parse(bodyText);
      jsonOk = j?.ok === true;
    } catch {
      // Not JSON; that's fine.
    }

    const twoXX = res.status >= 200 && res.status < 300;
    const opaqueLike = res.type === "opaque" || res.type === "opaqueredirect";
    const ok = twoXX || opaqueLike || jsonOk;

    if (!ok) {
      console.warn("[saveBooking] Non-success response", {
        status: res.status,
        statusText: res.statusText,
        type: res.type,
        bodyText,
      });
    }

    return ok;
  } catch (err) {
    console.error("[saveBooking] Network/Fetch error:", err);
    return false;
  }
}
