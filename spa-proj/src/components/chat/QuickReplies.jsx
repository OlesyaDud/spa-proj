import React from "react";

// One-tap suggestions to guide users
export default function QuickReplies({ options, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
        >
          {o}
        </button>
      ))}
    </div>
  );
}
