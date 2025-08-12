// src/sections/Booking.jsx
import React, { useEffect, useState } from "react";
import Section from "./Section.jsx";
import BookingForm from "../components/BookingForm.jsx";
import { fetchServices } from "../data/services.js";
import { saveBooking } from "../utils/saveBooking.js";

export default function Booking() {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load services from Supabase
  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchServices();
        const mapped = rows.map((r) => ({
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
  }, []);

  const handleSubmit = async (payload) => {
    // payload.service = selected service id
    const svc = services.find((x) => x.id === payload.service);

    // Shape exactly what your Apps Script expects:
    // [Timestamp (server), serviceId, serviceName, date, name, email, phone, notes, transcript, source]
    const toSend = {
      serviceId: svc?.id || payload.service,
      serviceName: svc?.name || payload.service,
      date: payload.date || "",
      name: payload.name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      notes: payload.notes || "",
      transcript: "", // no chat history on the page form
      source: "webform",
    };

    setSubmitting(true);
    try {
      const ok = await saveBooking(toSend);
      console.log("[Booking] saveBooking result:", ok);
      // No UI banner—silent success/failure. You can add analytics or
      // reset the form via a ref if you want.
    } catch (err) {
      console.error("[Booking] saveBooking error:", err);
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

          <BookingForm
            onSubmit={handleSubmit}
            services={services}
            disabled={submitting || loadingServices}
          />
        </div>
      </div>
    </Section>
  );
}
