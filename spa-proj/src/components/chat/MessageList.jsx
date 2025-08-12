// ../components/chat/MessageList.jsx
import React, { useEffect, useRef } from "react";

export default function MessageList({ items = [] }) {
  const endRef = useRef(null);
  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [items]
  );

  return (
    <div className="space-y-3">
      {items.map((m, i) => {
        const isUser = m.role === "user";
        return (
          <div
            key={i}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                isUser
                  ? "bg-violet-500 text-white"
                  : "bg-violet-50 text-slate-700 ring-1 ring-violet-100",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
