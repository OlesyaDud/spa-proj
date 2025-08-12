import React from "react";

// Generic layout wrapper that constrains width and adds vertical rhythm
export default function Section({ id, children, className = "" }) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-6xl px-4 py-12 md:py-16 ${className}`}
    >
      {children}
    </section>
  );
}

// Helper to smooth-scroll to anchor sections
export const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
