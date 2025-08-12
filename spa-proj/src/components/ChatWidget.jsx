import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import CustomerServiceBot from "./bots/CustomerServiceBot.jsx";
import FAQBot from "./bots/FAQBot.jsx";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("cs");

  return (
    // This wrapper covers the viewport but ignores all clicks by default
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="
          pointer-events-auto fixed bottom-6 right-6
          h-14 w-14 rounded-full bg-[#a08bc8] text-white
          shadow-[0_18px_40px_-15px_rgba(139,92,246,0.7)]
          hover:bg-[#aa98cd] transition flex items-center justify-center
        "
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          className="
            pointer-events-auto fixed bottom-24 right-6
            w-[400px] max-w-[92vw] h-[70vh] max-h-[70vh]
            rounded-3xl bg-white/95 ring-1 ring-gray-100
            shadow-xl overflow-hidden flex flex-col min-h-0
          "
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-[#A78BFA]" />
              <span className="font-serif text-lg font-semibold text-gray-800">
                Spa Assistant
              </span>
            </div>
            <div className="flex items-center rounded-full bg-slate-100/80 p-1 text-xs">
              <button
                onClick={() => setTab("cs")}
                className={`px-3 py-1 rounded-full ${
                  tab === "cs"
                    ? "bg-white shadow text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Service
              </button>
              <button
                onClick={() => setTab("faq")}
                className={`px-3 py-1 rounded-full ${
                  tab === "faq"
                    ? "bg-white shadow text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                FAQ
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 p-4 pb-3 bg-white/70 overflow-y-auto overscroll-contain">
            {tab === "cs" ? <CustomerServiceBot /> : <FAQBot />}
          </div>
        </div>
      )}
    </div>
  );
}
