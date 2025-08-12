// src/components/chat/ChatInput.jsx
import React, { useState } from "react";

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your message…",
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy || disabled) return;
    try {
      setBusy(true);
      // Call parent's handler; don't assume it’s sync
      await Promise.resolve(onSend?.(t));
      setText("");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    // Enter to send; Shift+Enter would be newline if we used <textarea>
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled || busy}
        className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
        placeholder={placeholder}
        aria-label="Type a message"
      />
      <button
        onClick={submit}
        disabled={disabled || busy}
        className="rounded-xl bg-[#a08bc8] px-4 py-2 text-sm font-medium text-white hover:bg-[#aa98cd] disabled:opacity-50"
      >
        {busy ? "…" : "Send"}
      </button>
    </div>
  );
}
