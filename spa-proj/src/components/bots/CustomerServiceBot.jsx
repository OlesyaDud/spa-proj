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
          className="text-xs text-[#7c6f93]  hover:underline"
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
          className="text-xs text-[#7c6f93]  hover:underline"
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
          className="rounded-xl bg-[#a08bc8] px-4 py-2 text-white shadow  hover:bg-[#aa98cd] "
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

// treat anything that reads like a question as a question
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

// simple alias map (could be enriched with DB aliases too)
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

  // alias hit
  for (const [alias, target] of Object.entries(SERVICE_ALIASES)) {
    if (t.includes(alias)) {
      const svc = services.find(
        (s) => slug(s.name) === slug(target) || slug(s.id) === slug(target)
      );
      if (svc) return svc;
    }
  }

  // direct contains
  for (const s of services) {
    const id = slug(s.id);
    const nm = slug(s.name);
    if (t.includes(id) || t.includes(nm)) return s;
  }

  // token overlap fallback
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

  // services from Supabase
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // business config from Supabase
  const [biz, setBiz] = useState(null);

  // Views / state
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const scrollerRef = useRef(null);

  // Fetch services + business config on mount
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

  // Smooth auto-scroll whenever content grows
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

  // Esc closes booking
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
    setCurrentService(null); // browsing resets context
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

  const handleSend = useCallback(
    async (raw) => {
      const text = String(raw || "").trim();
      if (!text || pending) return;

      // quick escape to main chat
      if (/(^|\s)(back|close|exit|main menu|cancel)($|\s)/i.test(text)) {
        backToChat();
        return;
      }

      append({ role: "user", content: text });

      const intent = detectIntent(text);
      const maybeService = findServiceFromText(text, services);
      const question = isQuestion(text);

      // --- If it's a question, prefer a textual answer and close UI overlays ---
      if (question) {
        if (maybeService) {
          setShowServiceMenu(false);
          setSelectedService(null);
          setShowBooking(false);
          setCurrentService(maybeService);

          append({
            role: "bot",
            content:
              summarizeService(maybeService) +
              " Would you like to book it or see the service card?",
          });
          return;
        }

        setShowServiceMenu(false);
        setSelectedService(null);

        setPending(true);
        try {
          const system = `You are a friendly spa assistant. Be concise and helpful.
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
          const history = [...toAI(messages), { role: "user", content: text }];
          const ai = await askAssistant(history, system);
          const content =
            (typeof ai === "string" && ai) ||
            ai?.content ||
            ai?.message ||
            ai?.text ||
            "Sorry, I didn’t catch that. Could you rephrase?";

          append({ role: "bot", content: String(content).trim() });
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
        return;
      }

      // --- Non-question flows (menus/cards as before) ---

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

      if (intent === "greeting") {
        append({
          role: "bot",
          content:
            "Welcome! I can show services, explain pricing, or start a booking — what would you like?",
        });
        return;
      }
      if (intent === "hours") {
        append({
          role: "bot",
          content: biz
            ? `We're open Mon–Fri ${biz.hours.mon_fri}, Sat ${biz.hours.sat}. Closed Sundays.`
            : "Our hours are loading…",
        });
        return;
      }
      if (intent === "location") {
        append({
          role: "bot",
          content: biz ? `We're at ${biz.address}.` : "Our address is loading…",
        });
        return;
      }
      if (intent === "policy") {
        append({
          role: "bot",
          content:
            biz?.policies?.cancellation ||
            "Our cancellation policy is loading…",
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

      setShowServiceMenu(false);
      setSelectedService(null);

      setPending(true);
      try {
        const system = `You are a friendly spa assistant. Be concise and helpful.
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
        const history = [...toAI(messages), { role: "user", content: text }];
        const ai = await askAssistant(history, system);
        const content =
          (typeof ai === "string" && ai) ||
          ai?.content ||
          ai?.message ||
          ai?.text ||
          "Sorry, I didn’t catch that. Could you rephrase?";
        append({ role: "bot", content: String(content).trim() });
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
    ]
  );

  // ---- UPDATED: now async and saves to Google Sheets with transcript ----
  const onSubmitBooking = async (payload) => {
    const s =
      selectedService || services.find((x) => x.id === payload.service) || null;

    const when = payload.date
      ? formatDate(new Date(payload.date))
      : "(date TBD)";

    // Build a short transcript (last ~8 turns)
    const transcript = messages
      .slice(-8)
      .map((m) => `${m.role === "bot" ? "assistant" : "user"}: ${m.content}`)
      .join(" | ");

    // Try to save the booking (Google Apps Script)
    try {
      await saveBooking({
        serviceId: s?.id || payload.service,
        serviceName: s?.name || payload.service,
        date: payload.date || "",
        name: payload.name || "",
        email: payload.email || "",
        phone: payload.phone || "",
        notes: payload.notes || "",
        transcript, // short chat transcript
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
      {/* Scrollable messages */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-white/80 p-3 ring-1 ring-violet-100"
      >
        <MessageList items={messages} />

        {/* Menus / Details */}
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

      {/* Booking form with navigation controls */}
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

          {/* Pass lockedService so the picker is hidden/locked */}
          <BookingForm
            onSubmit={onSubmitBooking}
            services={services}
            lockedService={selectedService}
          />
        </div>
      )}

      {/* Input */}
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
