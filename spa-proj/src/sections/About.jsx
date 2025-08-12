import React from "react";
import Section from "./Section.jsx";
import spaAbout from "../assets/spa-about.jpg"; // adjust path if needed

export default function About() {
  return (
    <Section
      id="about"
      className="
        relative grid gap-10 md:gap-14
        grid-cols-1 md:grid-cols-[1.2fr_1fr]
      "
    >
      {/* subtle top gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 h-28 bg-gradient-to-b from-violet-100/25 to-transparent rounded-3xl"
      />

      {/* LEFT: copy */}
      <div className="max-w-3xl">
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-slate-800 font-serif leading-[1.05]">
          Where Wellness <span className="text-[#aa98cd]">Meets</span> Luxury
        </h2>

        <p className="mt-6 text-lg md:text-xl leading-8 text-slate-600">
          At Serenity Spa, we believe that true wellness comes from the perfect
          harmony of mind, body, and spirit. Our sanctuary has been thoughtfully
          designed to transport you away from the stresses of everyday life into
          a world of pure tranquility.
        </p>
        <p className="mt-6 text-lg md:text-xl leading-8 text-slate-600">
          Our team of highly trained therapists combines ancient healing
          traditions with modern wellness techniques, creating personalized
          experiences that nurture your individual needs. From the moment you
          step through our doors, every detail has been crafted to ensure your
          journey to rejuvenation is nothing short of extraordinary.
        </p>

        {/* stats */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            className="
              rounded-3xl bg-white/95 p-8 text-center ring-1 ring-slate-100
              shadow-[0_18px_50px_-24px_rgba(139,92,246,0.25)]
            "
          >
            <div className="text-4xl md:text-5xl font-semibold text-[#aa98cd]">
              5+
            </div>
            <div className="mt-2 text-slate-500">Years of Excellence</div>
          </div>

          <div
            className="
              rounded-3xl bg-white/95 p-8 text-center ring-1 ring-slate-100
              shadow-[0_18px_50px_-24px_rgba(139,92,246,0.25)]
            "
          >
            <div className="text-4xl md:text-5xl font-semibold text-[#aa98cd]">
              1000+
            </div>
            <div className="mt-2 text-slate-500">Happy Clients</div>
          </div>
        </div>
      </div>

      {/* RIGHT: image */}
      <div className="md:justify-self-end">
        <div
          className="
            relative overflow-hidden rounded-[2rem]
            ring-1 ring-slate-100
            shadow-[0_30px_90px_-40px_rgba(139,92,246,0.35)]
          "
        >
          <img
            alt="Spa about"
            src={spaAbout}
            className="h-[420px] md:h-[520px] w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10" />
        </div>
      </div>
    </Section>
  );
}
