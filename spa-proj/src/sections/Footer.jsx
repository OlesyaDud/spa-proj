// src/sections/Footer.jsx
import React, { useEffect, useState } from "react";
import Section, { scrollToId } from "./Section.jsx";
import { fetchBusinessConfig } from "../data/config.js";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import {
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
} from "react-icons/hi";

export default function Footer() {
  const [biz, setBiz] = useState(null);

  useEffect(() => {
    fetchBusinessConfig().then(setBiz).catch(console.error);
  }, []);

  return (
    <footer className="bg-slate-50 text-slate-600">
      <Section className="grid gap-12 md:grid-cols-4">
        {/* Brand */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Serenity Spa</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Your sanctuary of wellness and relaxation. Where luxury meets
            tranquility in the heart of the city.
          </p>

          {/* Socials */}
          <div className="mt-5 flex space-x-4  text-[#aa98cd]">
            <a
              href="#"
              aria-label="Instagram"
              className="hover:text-violet-500"
            >
              <FaInstagram size={18} />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-violet-500">
              <FaFacebookF size={18} />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-violet-500">
              <FaTwitter size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-base font-semibold text-slate-800">
            Quick Links
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <button
                onClick={() => scrollToId("services")}
                className="hover:text-violet-500 transition"
              >
                Our Services
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToId("about")}
                className="hover:text-violet-500 transition"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToId("booking")}
                className="hover:text-violet-500 transition"
              >
                Book Appointment
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToId("testimonials")}
                className="hover:text-violet-500 transition"
              >
                Testimonials
              </button>
            </li>
            <li>
              <a href="#" className="hover:text-violet-500 transition">
                Gift Cards
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-base font-semibold text-slate-800">Contact Us</h4>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <HiOutlineLocationMarker className="mt-0.5  text-[#aa98cd]" />
              <span>{biz ? biz.address : "Loading address…"}</span>
            </li>
            <li className="flex items-center gap-2">
              <HiOutlinePhone className=" text-[#aa98cd]" />
              <span>{biz ? biz.phone : "Loading phone…"}</span>
            </li>
            <li className="flex items-center gap-2">
              <HiOutlineMail className=" text-[#aa98cd]" />
              <span>{biz ? biz.email : "Loading email…"}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-base font-semibold text-slate-800">
            Stay Connected
          </h4>
          <p className="mt-3 text-sm text-slate-500">
            Subscribe to receive wellness tips, exclusive offers, and spa
            updates.
          </p>
          <form className="mt-4 flex">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-l-xl border border-violet-100 bg-white/90 px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-violet-300 focus:ring focus:ring-violet-200/70 transition"
            />
            <button
              type="submit"
              className="rounded-r-xl bg-[#a08bc8] px-4 py-2 text-sm font-medium text-white   hover:bg-[#aa98cd] transition"
            >
              Join
            </button>
          </form>
        </div>
      </Section>

      {/* Bottom bar */}
      <div className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Serenity Spa. All rights reserved.
      </div>
    </footer>
  );
}
