import React from "react";
import Section, { scrollToId } from "./Section.jsx";
import heroImg from "../assets/hero.jpg"; // make sure the path is correct

export default function Hero() {
  return (
    <div className="relative h-[80vh] flex items-center justify-center text-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-violet-900/30" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-4">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
          Relax. <span className="text-violet-300">Rejuvenate.</span> Renew.
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-100">
          Experience the ultimate in luxury wellness and relaxation. Our
          sanctuary of serenity awaits you with personalized treatments designed
          to restore your mind, body, and spirit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => scrollToId("booking")}
            className="rounded-xl bg-[#a08bc8] px-6 py-3 text-base font-medium text-white shadow hover:bg-[#aa98cd]"
          >
            Book Appointment
          </button>
          <button
            onClick={() => scrollToId("services")}
            className="rounded-xl border border-white text-white px-6 py-3 text-base font-medium hover:bg-white hover:text-violet-600"
          >
            Explore Services
          </button>
        </div>
      </div>
    </div>
  );
}
