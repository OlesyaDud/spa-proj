import React, { useState } from "react";
import Section from "./Section.jsx";
import BookingForm from "../components/BookingForm.jsx";
import { SERVICE_CATALOG } from "../data/services.js";
import { saveBooking } from "../utils/saveBooking.js";

export default function Booking() {
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    const s = SERVICE_CATALOG.find((x) => x.id === payload.service);
    const toSend = { ...payload, serviceName: s?.name || payload.service };

    setSubmitting(true);
    setStatus({ type: "idle", text: "" });

    try {
      const ok = await saveBooking(toSend);
      if (!ok) throw new Error("Save failed");

      setStatus({
        type: "ok",
        text: "Thanks! Your request was received — we’ll be in touch shortly.",
      });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        text: "Sorry, we couldn’t save your request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="booking">
      <div className="relative mt-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/95 p-8 md:p-12 ring-1 ring-slate-100 shadow-[0_18px_70px_-28px_rgba(139,92,246,0.35)]">
          <h3 className="text-center text-2xl md:text-3xl font-semibold text-slate-800">
            Schedule Your Appointment
          </h3>

          <div className="mt-8" />

          <BookingForm onSubmit={handleSubmit} />

          {/* Inline status message (no alert) */}
          {status.text && (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ring-1 ${
                status.type === "ok"
                  ? "bg-violet-50 text-violet-700 ring-violet-200"
                  : "bg-rose-50 text-rose-700 ring-rose-200"
              }`}
            >
              {status.text}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
