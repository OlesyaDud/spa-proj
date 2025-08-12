import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function SoftSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  disabled = false,
}) {
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const idxByValue = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // When opening, set active to selected or first
    setActiveIndex(idxByValue >= 0 ? idxByValue : 0);
  }, [open, idxByValue]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const selectAt = (i) => {
    const opt = options[i];
    if (!opt) return;
    onChange?.(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      // Open with Enter/Space/ArrowDown
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => Math.min(options.length - 1, p + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => Math.max(0, p - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectAt(activeIndex >= 0 ? activeIndex : 0);
    }
  };

  const triggerClasses = `
    w-full rounded-2xl border border-violet-100 bg-white/95
    px-4 py-3 pr-10 text-sm text-slate-700 shadow-sm
    focus:outline-none focus:border-violet-300 focus:ring focus:ring-violet-200/70
    flex items-center justify-between
    ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
    ${className}
  `;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={triggerClasses}
      >
        <span className="truncate text-left">
          {idxByValue >= 0 ? (
            options[idxByValue].label
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`ml-3 flex-shrink-0 text-violet-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          ref={listRef}
          tabIndex={-1}
          className="
            absolute z-50 mt-2 w-full rounded-2xl bg-white
            border border-violet-100 ring-1 ring-violet-100
            shadow-xl max-h-60 overflow-auto
          "
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            const active = i === activeIndex;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectAt(i)}
                data-index={i}
                className={`
                  w-full px-3 py-2 text-left text-sm
                  ${active ? "bg-violet-50" : ""}
                  ${selected ? "text-violet-700 font-medium" : "text-slate-700"}
                  flex items-center gap-2
                `}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {selected && <Check size={16} className="text-violet-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
