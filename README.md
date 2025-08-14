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

📁 Project Structure
src/
├── components/
│   ├── BookingForm.jsx      # Appointment booking form
│   ├── ChatWidget.jsx       # Main chat interface
│   └── SoftSelect.jsx       # Service selection component
├── bots/
│   ├── CustomerServiceBot.jsx # Main bot logic
│   └── FAQBot.jsx            # FAQ handling
├── sections/
│   ├── About.jsx
│   ├── Services.jsx
│   └── Hero.jsx
├── utils/
│   ├── aiChat.js            # OpenAI integration
│   ├── saveBooking.js       # Google Sheets integration
│   └── supabaseClient.js    # Database client
└── data/
    └── sections.js          # Page content


🗄️ Database Schema
Core Tables
Services
sqlcreate table public.services (
  id text primary key,
  name text not null,
  duration integer not null,
  price_from numeric not null,
  description text not null
);

Business Configuration
sqlcreate table public.business_config (
  id integer primary key default 1,
  name text,
  phone text,
  email text,
  address text,
  hours jsonb,
  policies jsonb
);


Chat History
sqlcreate table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.messages (
  id bigserial primary key,
  conversation_id uuid not null references public.conversations(id),
  role text not null check (role in ('user','assistant')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);


Vector Knowledge Base (RAG)
Enable Vector Extension
sqlcreate extension if not exists vector;
Knowledge Table
sqlcreate table public.knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text not null,            -- e.g. 'spa:service:hot-stone'
  chunk text not null,           -- the actual content
  metadata jsonb not null default '{}',
  embedding vector(1536)         -- OpenAI embedding
);

Vector Index for Performance
sqlcreate index idx_knowledge_embedding
on public.knowledge
using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);
Similarity Search Function
sqlcreate or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold float default 0.60
)
returns table (
  id uuid,
  slug text,
  chunk text,
  metadata jsonb,
  similarity float
)
language sql stable as $$
  select
    k.id,
    k.slug,
    k.chunk,
    k.metadata,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
    and 1 - (k.embedding <=> query_embedding) > similarity_threshold
  order by k.embedding <=> query_embedding
  limit match_count;
$$;


🔍 Testing Vector Search
Test Similarity Search
sql-- Test with hours FAQ
select * from public.match_knowledge(
  (select embedding from public.knowledge
   where slug = 'spa:faq:hours' limit 1),
  5,    -- top 5 results
  0.55  -- similarity threshold
);

-- Test with cancellation policy
select * from public.match_knowledge(
  (select embedding from public.knowledge 
   where slug = 'spa:faq:cancellation' limit 1),
  5, 0.55
);

-- Test with hot stone service
select * from public.match_knowledge(
  (select embedding from public.knowledge 
   where slug = 'spa:services:hot-stone' limit 1),
  5, 0.55
);

Diagnostic Queries
sql-- Check embedding status
select count(*) total, count(embedding) embedded 
from public.knowledge;

-- Verify index exists
select relname from pg_class 
where relname = 'idx_knowledge_embedding';


RAG hits knowledge with pgvector similarity via an SQL RPC.

🔎 RAG flow (in one breath)
User asks → Edge function embeds the query → match_knowledge RPC returns top chunks → Function builds a grounded system prompt (“answer using only this context”) → Sends to OpenAI → Returns answer to the UI.

🧪 How to verify RAG
Ask in the chat:
“What’s your cancellation policy?” → should answer from knowledge (RAG)
“Tell me about Hot Stone Therapy.” → description pulled from knowledge
“Do you sell gift cards?” → from knowledge


2. Environment Variables
Create .env.local:
envVITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key


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


🤝 Contributing
Fork the repository
Create a feature branch
Commit your changes
Push to the branch
Create a Pull Request



![App Preview](https://github.com/user-attachments/assets/2c00d301-b697-4fc4-a080-9aa04bb3540b)
