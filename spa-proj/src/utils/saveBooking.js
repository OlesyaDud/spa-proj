const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

/**
 * Sends a booking to Google Sheets (via Apps Script).
 * Returns true if the request succeeded.
 */
export async function saveBooking(payload) {
  // Use text/plain to avoid a CORS preflight – Apps Script can read it fine.
  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
