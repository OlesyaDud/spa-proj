import React from "react";
import Section, { scrollToId } from "./Section.jsx";
import { SERVICE_CATALOG } from "../data/services.js";
import { Heart, Sparkles, Leaf, Flower2, Waves, Wind } from "lucide-react";

const icons = [Heart, Sparkles, Leaf, Flower2, Waves, Wind];

export default function Services() {
  return (
    <Section id="services">
      {/* Heading */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
          Our{" "}
          <span className="text-purple-400 font-serif">Signature Services</span>
        </h2>
        <p className="mt-3 text-gray-500">
          Discover our carefully curated selection of wellness treatments, each
          designed to provide you with a unique path to relaxation and renewal.
        </p>
      </div>

      {/* Services Grid */}
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CATALOG.map((s, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div
              key={s.id}
              className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Icon */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-400">
                <Icon size={28} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900">
                {s.name}
              </h3>

              {/* Description */}
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                {s.description}
              </p>

              {/* Duration & Price */}
              <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                <span>{s.duration} min</span>
                <span className="text-purple-400 font-medium">
                  From ${s.priceFrom}
                </span>
              </div>

              {/* Button */}
              <button
                onClick={() => scrollToId("booking")}
                className="mt-6 w-full rounded-xl border border-purple-200 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-50 transition-colors"
              >
                Chat to Learn More
              </button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
