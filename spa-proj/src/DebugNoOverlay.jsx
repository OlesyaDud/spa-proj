import { useEffect } from "react";

/**
 * TEMP helper: every 500ms it finds any full-screen fixed element
 * with high z-index that can catch clicks and disables its pointer-events.
 * Remove this file after things are working again.
 */
export default function DebugNoOverlay() {
  useEffect(() => {
    const kill = () => {
      const nodes = Array.from(document.querySelectorAll("*"));
      nodes.forEach((el) => {
        const s = getComputedStyle(el);
        if (s.position !== "fixed") return;
        const r = el.getBoundingClientRect();
        const covers =
          r.left <= 0 &&
          r.top <= 0 &&
          r.right >= window.innerWidth &&
          r.bottom >= window.innerHeight;
        const z = parseInt(s.zIndex || "0", 10);
        if (covers && z >= 100 && s.pointerEvents !== "none") {
          el.style.pointerEvents = "none";
        }
      });
    };
    const id = setInterval(kill, 500);
    kill();
    return () => clearInterval(id);
  }, []);
  return null;
}
