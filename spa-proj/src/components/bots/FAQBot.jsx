// src/components/bots/FAQBot.jsx
import React, { useMemo, useState } from "react";
import { tryKBAnswer } from "../../bot/utils.js";
import MessageList from "../chat/MessageList.jsx";
import { Send } from "lucide-react";

export default function FAQBot() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hi! Ask me anything about our spa — hours, location, services, or policies.",
    },
  ]);
  const [text, setText] = useState("");

  const handleSend = async (raw) => {
    const value = (raw ?? text).trim();
    if (!value) return;

    setMessages((m) => [...m, { role: "user", content: value }]);
    setText("");
    await new Promise((r) => setTimeout(r, 250));

    // Use the async KB lookup (services + business info from Supabase)
    const kb = await tryKBAnswer(value);
    const response =
      kb ??
      "I couldn't find that in my notes. Try asking about hours, location, services & pricing, or our cancellation policy.";
    setMessages((m) => [...m, { role: "bot", content: response }]);
  };

  const quicks = useMemo(
    () => [
      "What are your hours?",
      "Where are you located?",
      "How much is a couples retreat?",
      "What's your cancellation policy?",
      "Show me services",
    ],
    []
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      {/* Messages */}
      <div
        className="
          flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth
          rounded-2xl bg-white/80 p-4 pr-3 ring-1 ring-violet-100
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <MessageList items={messages} />
      </div>

      {/* Quick Replies */}
      <div className="flex flex-wrap gap-2 px-2 sm:px-3">
        {quicks.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="
              rounded-full border border-violet-200 bg-violet-50
              px-3 py-1.5 text-xs font-medium text-violet-700
              hover:bg-violet-100 transition
            "
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 p-2 sm:p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question…"
          className="
            w-full rounded-full border border-violet-100 bg-white/95
            px-4 py-3 text-sm text-slate-700 placeholder-slate-400 shadow-sm
            focus:outline-none focus:border-violet-300 focus:ring focus:ring-violet-200/70 transition
          "
        />
        <button
          onClick={() => handleSend()}
          aria-label="Send"
          className="
            h-11 w-11 flex-shrink-0 rounded-full bg-violet-500 text-white
            flex items-center justify-center
            shadow-[0_12px_30px_-18px_rgba(139,92,246,0.6)]
            hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 transition
          "
        >
          <Send size={18} />
        </button>
      </div>

      <p className="px-2 sm:px-3 text-[11px] text-slate-500">
        Tip: ask about hours, location, services & pricing, or our cancellation
        policy.
      </p>
    </div>
  );
}
