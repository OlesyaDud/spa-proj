// src/components/bots/CustomerServiceBot.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchBusinessConfig } from "../../data/config.js";
import { fetchServices } from "../../data/services.js";
import { detectIntent, formatDate } from "../../bot/utils.js";
import MessageList from "../chat/MessageList.jsx";
import BookingForm from "../BookingForm.jsx";
import ChatInput from "../chat/ChatInput.jsx";
import { askAssistant } from "../../utils/aiChat.js";
import { saveBooking } from "../../utils/saveBooking.js";

/* ----------------------------- UI pieces ----------------------------- */

function ServiceMenu({ services, onPick, onClose }) {
  return (
    <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-violet-100 shadow-[0_12px_30px_-18px_rgba(139,92,246,0.25)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">
          Tap a service to see details
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[#7c6f93] hover:underline"
        >
          ⟵ Back to chat
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="rounded-full border border-violet-200/70 bg-white px-3 py-2 text-sm text-[#815dbd] hover:bg-violet-50 transition"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceDetails({ service, onBack, onBook }) {
  return (
    <div className="rounded-2xl bg-white/95 p-5 ring-1 ring-violet-100 shadow-[0_12px_30px_-18px_rgba(139,92,246,0.25)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-base font-semibold text-slate-800">
          {service.name}
        </div>
        <button
          onClick={onBack}
          className="text-xs text-[#7c6f93] hover:underline"
        >
          ⟵ Back to services
        </button>
      </div>

      <p className="text-sm text-slate-700 leading-6">{service.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl bg-violet-50/60 p-3 ring-1 ring-violet-100">
          <div className="text-slate-500">Duration</div>
          <div className="font-medium text-slate-800">
            {service.duration} min
          </div>
        </div>
        <div className="rounded-xl bg-violet-50/60 p-3 ring-1 ring-violet-100">
          <div className="text-slate-500">From</div>
          <div className="font-medium text-slate-800">${service.priceFrom}</div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onBook}
          className="rounded-xl bg-[#a08bc8] px-4 py-2 text-white shadow hover:bg-[#aa98cd]"
        >
          Start Booking
        </button>
        <button
          onClick={onBack}
          className="rounded-xl border border-violet-300 px-4 py-2 text-[#7c6f93] hover:bg-violet-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Matching helpers ------------------------ */

const isPriceQ = (t = "") => /\b(price|cost|how much)\b/i.test(t);
const isDurationQ = (t = "") => /\b(duration|how long)\b/i.test(t);
const isDetailsQ = (t = "") =>
  /\b(details|what is|tell me more|include|about|explain|describe)\b/i.test(t);
const isBookQ = (t = "") => /\b(book|schedule|reserve|appointment)\b/i.test(t);

const isQuestion = (t = "") =>
  /\?|^\s*(what|how|why|tell me|explain|describe|details|about|include)\b/i.test(
    String(t)
  );

const slug = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SERVICE_ALIASES = {
  "hot stone": "hot stone therapy",
  "hot stones": "hot stone therapy",
  hotstone: "hot stone therapy",
  "stone massage": "hot stone therapy",
  wrap: "detoxifying body wraps",
  "body wrap": "detoxifying body wraps",
  aroma: "aromatherapy sessions",
  aromatherapy: "aromatherapy sessions",
  facial: "rejuvenating facials",
  facials: "rejuvenating facials",
  massage: "signature massage",
  couples: "couples retreat",
};

function findServiceFromText(text, services) {
  const t = slug(text);

  for (const [alias, target] of Object.entries(SERVICE_ALIASES)) {
    if (t.includes(alias)) {
      const svc = services.find(
        (s) => slug(s.name) === slug(target) || slug(s.id) === slug(target)
      );
      if (svc) return svc;
    }
  }

  for (const s of services) {
    const id = slug(s.id);
    const nm = slug(s.name);
    if (t.includes(id) || t.includes(nm)) return s;
  }

  let best = null;
  for (const s of services) {
    const tokens = slug(s.name).split(" ").filter(Boolean);
    const score = tokens.reduce(
      (acc, tok) => acc + (t.includes(tok) ? 1 : 0),
      0
    );
    if (!best || score > best._score) best = { ...s, _score: score };
  }
  return best && best._score > 0 ? best : null;
}

const summarizeService = (s) =>
  `${s.name}: ${s.description} (~${s.duration} min, from $${s.priceFrom}).`;

/* ---------- helpers for business_config answers (hours/location/policy) --- */

function answerHours(text, biz) {
  if (!biz?.hours) return null;
  const h = biz.hours || {};
  const monFri = h.mon_fri || h.monFri || h.weekdays;
  const sat = h.sat || h.saturday;
  const sun = h.sun || h.sunday || "Closed";

  if (/weekend/i.test(text)) {
    return `Weekend hours: Sat ${sat || "—"}, Sun ${sun}.`;
  }
  if (/\bsat(urday)?\b/i.test(text)) {
    return `Saturday hours: ${sat || "—"}.`;
  }
  if (/\bsun(day)?\b/i.test(text)) {
    return `Sunday: ${sun}.`;
  }
  return `We're open Mon–Fri ${monFri || "—"}, Sat ${
    sat || "—"
  }. Closed Sundays.`;
}

function answerLocation(biz) {
  return biz?.address ? `We're at ${biz.address}.` : null;
}

function answerPolicy(biz) {
  const c = biz?.policies?.cancellation;
  if (c) return c;
  // friendly fallback
  return "Please provide 24 hours notice to cancel or reschedule.";
}

/* ----------------------------- Main Bot ------------------------------ */

export default function CustomerServiceBot() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hi! I can help with booking, pricing, hours and directions. What can I do for you today?",
    },
  ]);
  const [pending, setPending] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [biz, setBiz] = useState(null);

  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const scrollerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchServices();
        const mapped = (rows || []).map((r) => ({
          id: r.id,
          name: r.name,
          duration: r.duration,
          priceFrom: Number(r.price_from),
          description: r.description,
        }));
        setServices(mapped);
      } catch (e) {
        console.error("Failed to load services:", e);
      } finally {
        setLoadingServices(false);
      }
    })();

    fetchBusinessConfig().then(setBiz).catch(console.error);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    );
  }, [messages, pending, showServiceMenu, selectedService, showBooking]);

  const append = (msg) => setMessages((m) => [...m, msg]);

  const backToChat = useCallback(() => {
    setShowBooking(false);
    setSelectedService(null);
    setShowServiceMenu(false);
    setCurrentService(null);
    setPending(false);
    append({
      role: "bot",
      content: "Okay — back to the main chat. How can I help?",
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showBooking) backToChat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBooking, backToChat]);

  const backToServicesFromBooking = useCallback(() => {
    setShowBooking(false);
    setSelectedService(null);
    setShowServiceMenu(true);
  }, []);

  const toAI = (items) =>
    items.map((m) => ({
      role: m.role === "bot" ? "assistant" : "user",
      content: String(m.content ?? ""),
    }));

  const openServiceMenu = useCallback(() => {
    setCurrentService(null);
    setSelectedService(null);
    setShowServiceMenu(true);
  }, []);

  const closeServiceMenu = useCallback(() => {
    setSelectedService(null);
    setShowServiceMenu(false);
    append({
      role: "bot",
      content: "No problem — back to the main chat. How can I help?",
    });
  }, []);

  const openDetails = useCallback((svc) => {
    setSelectedService(svc);
    setCurrentService(svc);
  }, []);

  const backToServices = useCallback(() => {
    setSelectedService(null);
    setCurrentService(null);
  }, []);

  const startBooking = useCallback(() => {
    setShowBooking(true);
    append({
      role: "bot",
      content:
        "Great! I'll collect a few details. Use the booking form below to continue.",
    });
  }, []);

  const buildSystemPrompt = useCallback(() => {
    return `You are a friendly spa assistant. Be concise and helpful.
Only offer the services menu if the user explicitly asks for "services".
If a current service is provided, use it to answer follow-ups directly.

${
  currentService
    ? `Current service context:
- name: ${currentService.name}
- description: ${currentService.description}
- duration: ${currentService.duration} minutes
- price_from: $${currentService.priceFrom}`
    : ""
}`;
  }, [currentService]);

  const callAI = useCallback(
    async (userText) => {
      setPending(true);
      try {
        const history = [
          ...toAI(messages),
          { role: "user", content: userText },
        ];
        const system = buildSystemPrompt();

        let res;
        try {
          res = await askAssistant(history, system, {
            topK: 8,
            threshold: 0.55,
          });
        } catch {
          res = await askAssistant(history, system, conversationId);
        }

        const reply = res?.reply ?? res; // support both shapes (utils returning {reply} or raw)
        const content =
          reply?.content ||
          reply?.message ||
          reply?.text ||
          (typeof reply === "string" ? reply : "");

        if (res?.conversation_id && res.conversation_id !== conversationId) {
          setConversationId(res.conversation_id);
        }

        append({ role: "bot", content: String(content || "…").trim() });

        // If you kept citations, show them; else they won’t appear.
        if (Array.isArray(res?.citations) && res.citations.length) {
          const tips = res.citations
            .map(
              (c) =>
                `• ${c.title || c.slug || "kb"} (${(c.similarity * 100).toFixed(
                  0
                )}% match)`
            )
            .join("\n");
          append({ role: "bot", content: `_Sources:_\n${tips}` });
        }
      } catch (e) {
        console.error(e);
        append({
          role: "bot",
          content:
            "Sorry, I had trouble answering that just now. Please try again.",
        });
      } finally {
        setPending(false);
      }
    },
    [messages, conversationId, buildSystemPrompt]
  );

  /* ------------------------ THE IMPORTANT CHANGE -----------------------
     Handle specific intents from business_config BEFORE the generic
     "question → AI" branch. This prevents hours/location questions from
     skipping your DB answers.
  --------------------------------------------------------------------- */

  const handleSend = useCallback(
    async (raw) => {
      const text = String(raw || "").trim();
      if (!text || pending) return;

      if (/(^|\s)(back|close|exit|main menu|cancel)($|\s)/i.test(text)) {
        backToChat();
        return;
      }

      append({ role: "user", content: text });

      const intent = detectIntent(text);
      const maybeService = findServiceFromText(text, services);

      // 1) PRIORITIZE business_config intents
      if (intent === "hours") {
        const ans = answerHours(text, biz);
        if (ans) {
          append({ role: "bot", content: ans });
          return;
        }
      }
      if (intent === "location") {
        const ans = answerLocation(biz);
        if (ans) {
          append({ role: "bot", content: ans });
          return;
        }
      }
      if (intent === "policy") {
        const ans = answerPolicy(biz);
        if (ans) {
          append({ role: "bot", content: ans });
          return;
        }
      }

      // 2) Service-specific flows
      if (maybeService) {
        setShowServiceMenu(false);
        setSelectedService(maybeService);
        setCurrentService(maybeService);
        append({
          role: "bot",
          content: `Here are the details for **${maybeService.name}**.`,
        });
        return;
      }

      // 3) Generic Q&A → AI/RAG
      const question = isQuestion(text);
      if (question) {
        setShowServiceMenu(false);
        setSelectedService(null);
        await callAI(text);
        return;
      }

      // 4) Non-question small intents
      if (intent === "greeting") {
        append({
          role: "bot",
          content:
            "Welcome! I can show services, explain pricing, or start a booking — what would you like?",
        });
        return;
      }
      if (intent === "book") {
        if (currentService) setSelectedService(currentService);
        startBooking();
        return;
      }

      if (/services?/.test(text.toLowerCase())) {
        if (!loadingServices && services.length > 0) {
          openServiceMenu();
        } else {
          append({
            role: "bot",
            content:
              "I’m still loading our services list—try again in a moment.",
          });
        }
        return;
      }

      if (currentService) {
        if (isPriceQ(text)) {
          append({
            role: "bot",
            content: `${currentService.name} starts at $${currentService.priceFrom}. Would you like to book or hear more details?`,
          });
          return;
        }
        if (isDurationQ(text)) {
          append({
            role: "bot",
            content: `${currentService.name} lasts about ${currentService.duration} minutes. Want to book it?`,
          });
          return;
        }
        if (isDetailsQ(text)) {
          append({ role: "bot", content: summarizeService(currentService) });
          return;
        }
        if (isBookQ(text)) {
          setSelectedService(currentService);
          startBooking();
          return;
        }
      }

      // Fallback to AI
      setShowServiceMenu(false);
      setSelectedService(null);
      await callAI(text);
    },
    [
      messages,
      pending,
      services,
      loadingServices,
      biz,
      currentService,
      backToChat,
      openServiceMenu,
      startBooking,
      callAI,
    ]
  );

  // ---- Booking submission ----
  const onSubmitBooking = async (payload) => {
    const s =
      selectedService || services.find((x) => x.id === payload.service) || null;

    const when = payload.date
      ? formatDate(new Date(payload.date))
      : "(date TBD)";

    const transcript = messages
      .slice(-8)
      .map((m) => `${m.role === "bot" ? "assistant" : "user"}: ${m.content}`)
      .join(" | ");

    try {
      await saveBooking({
        serviceId: s?.id || payload.service,
        serviceName: s?.name || payload.service,
        date: payload.date || "",
        name: payload.name || "",
        email: payload.email || "",
        phone: payload.phone || "",
        notes: payload.notes || "",
        transcript,
        source: "chatbot",
      });
    } catch (err) {
      console.error("saveBooking failed:", err);
    }

    append({
      role: "bot",
      content: `Thanks, ${payload.name || "friend"}! I’ve sent your ${
        s?.name || "service"
      } request for ${when}. We'll confirm via email (${
        payload.email || "n/a"
      }) or phone (${payload.phone || "n/a"}).`,
    });

    setShowBooking(false);
    setSelectedService(null);
    setShowServiceMenu(false);
    setCurrentService(null);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-white/80 p-3 ring-1 ring-violet-100"
      >
        <MessageList items={messages} />

        {showServiceMenu && !selectedService && (
          <div className="mt-3">
            <ServiceMenu
              services={services}
              onPick={openDetails}
              onClose={closeServiceMenu}
            />
          </div>
        )}

        {selectedService && (
          <div className="mt-3">
            <ServiceDetails
              service={selectedService}
              onBack={backToServices}
              onBook={startBooking}
            />
          </div>
        )}

        {pending && (
          <div className="mt-2 text-xs text-slate-500">
            Assistant is typing…
          </div>
        )}
      </div>

      {showBooking && (
        <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-violet-100 shadow-[0_12px_30px_-18px_rgba(139,92,246,0.25)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-700">
              Start Booking
            </div>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={backToServicesFromBooking}
                className="text-violet-700 hover:underline"
              >
                ⟵ Services
              </button>
              <button
                onClick={backToChat}
                className="text-slate-500 hover:underline"
                title="Esc"
              >
                Back to chat
              </button>
            </div>
          </div>

          <BookingForm
            onSubmit={onSubmitBooking}
            services={services}
            lockedService={selectedService}
          />
        </div>
      )}

      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSend}
          disabled={pending}
          placeholder={
            pending ? "Thinking…" : "Say “services” or ask about one by name…"
          }
        />
      </div>

      <p className="text-[11px] pb-5 text-slate-500">
        Tip: try “services”, “tell me about hot stone”, or “book an
        appointment”. Press Esc to close booking.
      </p>
    </div>
  );
}
