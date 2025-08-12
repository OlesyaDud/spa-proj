import React, { useRef, useState } from "react";
import { SERVICE_CATALOG } from "../data/services.js";
import SoftSelect from "./SoftSelect.jsx"; // (if you added custom select)
import SoftDatePicker from "../SoftDatePicker.jsx"; // ← NEW

export default function BookingForm({ defaults, onSubmit, compact = false }) {
  const [date, setDate] = useState(defaults?.date || "");
  const [service, setService] = useState(
    defaults?.service || SERVICE_CATALOG[0]?.id
  );
  const [name, setName] = useState(defaults?.name || "");
  const [email, setEmail] = useState(defaults?.email || "");
  const [phone, setPhone] = useState(defaults?.phone || "");
  const [notes, setNotes] = useState(defaults?.notes || "");

  const inputBase =
    "w-full rounded-2xl border border-violet-100 bg-white/95 px-4 py-3 text-sm text-slate-700 " +
    "placeholder-slate-400 shadow-sm focus:outline-none focus:border-violet-300 " +
    "focus:ring focus:ring-violet-200/70";

  const wrapPad = compact ? "p-5 md:p-6" : "p-7 md:p-8";
  const buttonClass =
    "rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-medium text-white " +
    "shadow-[0_12px_30px_-18px_rgba(139,92,246,0.6)] hover:bg-violet-600 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-300 transition";

  const serviceOptions = SERVICE_CATALOG.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <div
      className={`rounded-3xl bg-white/90 ${wrapPad} ring-1 ring-violet-100 shadow-[0_20px_50px_-28px_rgba(139,92,246,0.35)]`}
    >
      <div className="text-base font-semibold text-slate-800">
        Start Booking
      </div>

      {/* SERVICE + DATE */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-slate-600">
            Preferred Service <span className="text-violet-500">*</span>
          </label>
          {/* Use your SoftSelect or a regular select, your choice */}
          {SoftSelect ? (
            <SoftSelect
              options={serviceOptions}
              value={service}
              onChange={setService}
              placeholder="Select a service…"
            />
          ) : (
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={`${inputBase} appearance-none`}
            >
              {serviceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-slate-600">
            Preferred Date
          </label>
          {/* Right-aligned, stylable calendar */}
          <SoftDatePicker value={date} onChange={setDate} />
        </div>
      </div>

      {/* NAME / EMAIL / PHONE */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-slate-600">
            Full Name <span className="text-violet-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
            placeholder="Alex Doe"
            aria-required="true"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-slate-600">
            Email <span className="text-violet-500">*</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputBase}
            placeholder="alex@email.com"
            aria-required="true"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-slate-600">
            Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputBase}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      {/* NOTES */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={`${inputBase} resize-y`}
          placeholder="Allergies, pregnancy, special requests…"
        />
      </div>

      {/* ACTIONS */}
      <div className={`mt-5 ${compact ? "" : "flex justify-end"}`}>
        <button
          onClick={() => onSubmit({ date, service, name, email, phone, notes })}
          className={`${buttonClass} ${compact ? "w-full" : ""}`}
        >
          Request Appointment
        </button>
      </div>
    </div>
  );
}
