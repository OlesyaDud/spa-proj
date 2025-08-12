import React from "react";

// Simple chat bubble; styles switch based on role
export default function Bubble({ role, children }) {
  return (
    <div
      className={`max-w-[80%] rounded-2xl p-3 text-sm shadow ${
        role === "user" ? "ml-auto bg-indigo-600 text-white" : "bg-gray-100"
      }`}
    >
      {children}
    </div>
  );
}
