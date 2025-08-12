// src/components/BookingForm.jsx
import React, { useEffect, useRef, useState } from "react";
import SoftSelect from "./SoftSelect.jsx";
import SoftDatePicker from "../SoftDatePicker.jsx";

export default function BookingForm({
  defaults,
  services = [],
  onSubmit,
  compact = false,
  disabled = false,
  lockedService = null, // { id, name } when launched from chat
}) {
  const [date, setDate] = useState(defaults?.date || "");
  const [service, setService] = useState(
    lockedService?.id || defaults?.service || services[0]?.id || ""
  );
  const [name, setName] = useState(defaults?.name || "");
  const [email, setEmail] = useState(defaults?.email || "");
  const [phone, setPhone] = useState(defaults?.phone || "");
  const [notes, setNotes] = useState(defaults?.notes || "");

  // validation state
  const [errors, setErrors] = useState({ name: "", email: "", phone: "" });
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    if (lockedService?.id) setService(lockedService.id);
  }, [lockedService?.id]);

  const inputBase =
    "w-full rounded-2xl border bg-white/95 px-4 py-3 text-sm text-slate-700 " +
    "placeholder-slate-400 shadow-sm focus:outline-none focus:ring " +
    "border-violet-100 focus:border-violet-300 focus:ring-violet-200/70";
  const inputError =
    "border-rose-300 focus:border-rose-400 focus:ring-rose-200/70";

  const wrapPad = compact ? "p-5 md:p-6" : "p-7 md:p-8";
  const buttonClass =
    "rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-medium text-white " +
    "shadow-[0_12px_30px_-18px_rgba(139,92,246,0.6)] hover:bg-violet-600 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-300 transition";

  const serviceOptions = services.map((s) => ({ value: s.id, label: s.name }));

  // ---------- Validation helpers ----------
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // US format: +1(AAA)BBB-CCCC (country code 1 + 10 digits)
  const normalizePhone = (value) => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") {
      const a = digits.slice(1, 4);
      const b = digits.slice(4, 7);
      const c = digits.slice(7, 11);
      return `+1(${a})${b}-${c}`;
    }
    return null;
  };

  // ---------- Field handlers ----------
  const onPhoneChange = (v) => {
    // Allow free typing; strip disallowed chars only
    const cleaned = v.replace(/[^\d()+\- ]/g, "");
    setPhone(cleaned);
    if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
  };

  const onPhoneBlur = () => {
    const formatted = normalizePhone(phone);
    if (formatted) setPhone(formatted);
    else if (phone.trim()) {
      setErrors((e) => ({
        ...e,
        phone: "Phone must be like +1(555)555-5555.",
      }));
    }
  };

  const onEmailBlur = () => {
    if (!email.trim())
      return setErrors((e) => ({ ...e, email: "Email is required." }));
    setErrors((e) => ({
      ...e,
      email: emailRe.test(email.trim())
        ? ""
        : "Please enter a valid email address.",
    }));
  };

  const onNameBlur = () => {
    if (!name.trim())
      setErrors((e) => ({ ...e, name: "Full name is required." }));
    else if (errors.name) setErrors((e) => ({ ...e, name: "" }));
  };

  const validateAll = () => {
    const next = { name: "", email: "", phone: "" };
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!emailRe.test(email.trim()))
      next.email = "Please enter a valid email address.";
    if (!normalizePhone(phone))
      next.phone = "Phone must be like +1(555)555-5555.";
    setErrors(next);

    if (next.name) nameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.phone) phoneRef.current?.focus();

    return !next.name && !next.email && !next.phone;
  };

  const submit = () => {
    if (disabled) return;
    if (!validateAll()) return;

    const finalPhone = normalizePhone(phone);

    onSubmit({
      date,
      service,
      name: name.trim(),
      email: email.trim(),
      phone: finalPhone,
      notes,
    });
  };

  return (
    <div
      className={`rounded-3xl bg-white/90 ${wrapPad} ring-1 ring-violet-100 shadow-[0_20px_50px_-28px_rgba(139,92,246,0.35)]`}
    >
      <div className="text-base font-semibold text-slate-800">
        Start Booking
      </div>

      {/* SERVICE (own row) */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Preferred Service <span className="text-violet-500">*</span>
        </label>

        {lockedService ? (
          <>
            <div className="h-12 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-xs font-semibold">
                  ✓
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate font-medium text-slate-800">
                    {lockedService.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Locked from chat
                  </div>
                </div>
              </div>
            </div>
            <input type="hidden" value={service} readOnly />
          </>
        ) : SoftSelect ? (
          <SoftSelect
            options={serviceOptions}
            value={service}
            onChange={setService}
            placeholder="Select a service…"
            disabled={disabled}
          />
        ) : (
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={`${inputBase} appearance-none`}
            disabled={disabled}
          >
            {serviceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* DATE (own row) */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Preferred Date
        </label>
        <SoftDatePicker value={date} onChange={setDate} disabled={disabled} />
      </div>

      {/* NAME (own row) */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Full Name <span className="text-violet-500">*</span>
        </label>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={onNameBlur}
          className={`${inputBase} ${errors.name ? inputError : ""}`}
          placeholder="Alex Doe"
          aria-required="true"
          aria-invalid={!!errors.name}
          disabled={disabled}
          autoComplete="name"
        />
        {errors.name && (
          <p className="text-[12px] text-rose-600">{errors.name}</p>
        )}
      </div>

      {/* EMAIL (own row) */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Email <span className="text-violet-500">*</span>
        </label>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: "" }));
          }}
          onBlur={onEmailBlur}
          className={`${inputBase} ${errors.email ? inputError : ""}`}
          placeholder="alex@email.com"
          aria-required="true"
          aria-invalid={!!errors.email}
          disabled={disabled}
          inputMode="email"
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-[12px] text-rose-600">{errors.email}</p>
        )}
      </div>

      {/* PHONE (own row) */}
      <div className="mt-4 space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600">
          Phone <span className="text-violet-500">*</span>
        </label>
        <input
          ref={phoneRef}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={onPhoneBlur}
          className={`${inputBase} ${errors.phone ? inputError : ""}`}
          placeholder="+1(555)555-5555"
          aria-required="true"
          aria-invalid={!!errors.phone}
          disabled={disabled}
          inputMode="tel"
          autoComplete="tel"
        />
        {errors.phone && (
          <p className="text-[12px] text-rose-600">{errors.phone}</p>
        )}
      </div>

      {/* NOTES (own row) */}
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
          disabled={disabled}
        />
      </div>

      {/* ACTIONS */}
      <div className={`mt-5 ${compact ? "" : "flex justify-end"}`}>
        <button
          onClick={submit}
          disabled={disabled}
          className={`${buttonClass} ${compact ? "w-full" : ""} ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Request Appointment
        </button>
      </div>
    </div>
  );
}
