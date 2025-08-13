Serenity Spa — AI Assistant (React + Supabase + RAG)
A small, production-style demo of a spa website with an on-brand chatbot that answers real questions (hours, pricing, policies, service details) and starts bookings.
Answers are grounded with RAG over a Supabase pgvector knowledge base, and booking requests are saved to Google Sheets via Apps Script.

✨ What it does
Chatbot that:
Answers from your own data (RAG over a knowledge table)
Handles quick intents (hours, location, policies)
Can open the booking form with the service pre-selected
Booking form
Email + phone validation
Saves to Google Sheets (and includes a short chat transcript when coming from chat)

Clean data
Services & business info in Supabase
Conversations/messages (optional) for audit/training

🧱 Stack
Frontend: React + Vite, Tailwind UI components
Backend: Supabase (Postgres + pgvector)
RAG: OpenAI text-embedding-3-small + SQL RPC (match_knowledge)
Chat model: OpenAI gpt-4o-mini
Bookings: Google Apps Script → Google Sheets
Supabase Edge Function: /chat (does retrieval + calls OpenAI)

🗂️ Data model (Supabase)
services — id, name, duration, price_from, description, (optional) aliases
business_config — id=1, hours JSON, address, phone, email, policies JSON
knowledge — id, embedding vector(1536), slug/title, chunk text, metadata
conversations / messages — (optional) minimal chat history

RAG hits knowledge with pgvector similarity via an SQL RPC.

🔎 RAG flow (in one breath)
User asks → Edge function embeds the query → match_knowledge RPC returns top chunks → Function builds a grounded system prompt (“answer using only this context”) → Sends to OpenAI → Returns answer to the UI.

🧪 How to verify RAG
Ask in the chat:
“What’s your cancellation policy?” → should answer from knowledge (RAG)
“Tell me about Hot Stone Therapy.” → description pulled from knowledge
“Do you sell gift cards?” → from knowledge

🗒️ Bookings → Google Sheets (Apps Script)
Apps Script (Web App → Anyone):

const SHEET = 'Bookings';

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET) || SpreadsheetApp.getActive().insertSheet(SHEET);
  // columns: timestamp, serviceId, serviceName, date, name, email, phone, notes, transcript, source
  sh.appendRow([
    new Date(), data.serviceId||'', data.serviceName||'', data.date||'',
    data.name||'', data.email||'', data.phone||'',
    data.notes||'', data.transcript||'', data.source||'webform'
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok:true }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin','*');
}


4) Deploy the Edge Function (/chat)
Code lives in supabase/functions/chat/index.ts (Deno). It:
(a) answers hours/location directly from business_config
(b) runs RAG via match_knowledge
(c) calls OpenAI chat with the grounded context

Deploy:
supabase functions deploy chat --no-verify-jwt

supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY



![App Preview](https://github.com/user-attachments/assets/2c00d301-b697-4fc4-a080-9aa04bb3540b)
