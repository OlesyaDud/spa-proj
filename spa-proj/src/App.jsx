import Hero from "./sections/Hero.jsx";
import About from "./sections/About.jsx";
import Services from "./sections/Services.jsx";
import Testimonials from "./sections/Testimonials.jsx";
import Booking from "./sections/Booking.jsx";
import Footer from "./sections/Footer.jsx";
import ChatWidget from "./components/ChatWidget.jsx";

export default function SerenitySpaSite() {
  return (
    <div
      className="
        min-h-screen text-slate-900
        bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(167,139,250,0.12),transparent)]
        bg-[length:100%_100%]
      "
    >
      {/* Sticky header */}
      <header
        className="
          sticky top-0 z-40
          bg-white/80 backdrop-blur-sm
          border-b border-violet-100/70
          shadow-[0_8px_24px_-18px_rgba(139,92,246,0.35)]
        "
      >
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center gap-4">
          {/* Brand */}
          <a href="#top" className="flex items-center gap-2">
            {/* <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgba(167,139,250,0.15)]"
            /> */}
            <span className="font-serif text-xl font-semibold tracking-tight text-[#aa98cd]">
              Serenity Spa
            </span>
          </a>

          {/* Nav */}
          <nav className="ml-auto hidden md:flex items-center gap-1">
            {[
              { href: "#about", label: "About" },
              { href: "#services", label: "Services" },
              { href: "#testimonials", label: "Reviews" },
              { href: "#booking", label: "Book" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="
                  rounded-full px-3 py-1.5 text-sm
                  text-slate-600 hover:text-violet-700
                  hover:bg-violet-50
                  transition
                "
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <a
            href="#booking"
            className="
              rounded-full bg-[#a08bc8] px-4 py-2 text-sm font-medium text-white
              shadow-[0_14px_30px_-18px_rgba(139,92,246,0.6)]
              hover:bg-[#aa98cd] focus:outline-none focus:ring-2 focus:ring-violet-300
              transition
            "
          >
            Schedule
          </a>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Hero />
        <About />
        <Services />
        <Testimonials />
        <Booking />
      </main>

      <Footer />

      {/* Floating Chatbot */}
      <ChatWidget />
    </div>
  );
}
