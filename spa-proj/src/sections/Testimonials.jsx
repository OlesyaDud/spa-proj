import React from "react";
import Section from "./Section.jsx";

function Star({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-5 w-5 ${className}`}
      fill="currentColor"
    >
      <path d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.07.9-5.24-3.8-3.7 5.26-.77L10 2.5z" />
    </svg>
  );
}

const Avatar = ({ name }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-300 font-semibold">
      {initials}
    </div>
  );
};

function Testimonial({ name, role, quote }) {
  return (
    <div
      className="
        rounded-3xl bg-white/95 p-8 ring-1 ring-slate-100
        shadow-[0_14px_40px_-18px_rgba(139,92,246,0.25)]
        hover:shadow-[0_22px_60px_-20px_rgba(139,92,246,0.35)]
        transition-shadow
      "
    >
      <div className="flex items-center gap-1 text-violet-400" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} />
        ))}
      </div>

      <p className="mt-5 text-lg leading-8 text-slate-700">“{quote}”</p>

      <div className="mt-8 flex items-center gap-4">
        <Avatar name={name} />
        <div>
          <div className="text-base font-semibold text-slate-800">{name}</div>
          <div className="text-sm text-slate-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <Section id="testimonials">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-800">
          What Our Clients <span className="text-violet-500">Say</span>
        </h2>
        <p className="mt-3 text-slate-500">
          Don’t just take our word for it. Hear from those who’ve experienced
          the transformative power of our wellness treatments.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Testimonial
          name="Sarah Mitchell"
          role="Signature Massage Therapy"
          quote="The most incredible spa experience I’ve ever had. The atmosphere is so peaceful and the staff truly cares about your wellbeing. I left feeling completely renewed."
        />
        <Testimonial
          name="Michael Chen"
          role="Aromatherapy Sessions"
          quote="Serenity Spa is my sanctuary away from the busy city life. The aromatherapy sessions have helped me find balance and the space itself is absolutely beautiful."
        />
        <Testimonial
          name="Emily Rodriguez"
          role="Couples Retreat"
          quote="Every detail is perfect, from the calming music to the luxurious treatments. The couples retreat was the perfect experience for our anniversary."
        />
        <Testimonial
          name="David Thompson"
          role="Hot Stone Therapy"
          quote="Professional, relaxing, and transformative. The hot stone therapy helped relieve tension I’d been carrying for months."
        />
      </div>
    </Section>
  );
}
