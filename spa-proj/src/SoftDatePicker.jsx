import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// Helpers
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDisplay = (d) =>
  `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
const fromISO = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

function buildCalendar(monthDate) {
  // monthDate is first day of visible month (any day ok)
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 Sun .. 6 Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDay + 1;
    if (dayNum <= 0) {
      // prev month
      const d = new Date(year, month - 1, prevDays + dayNum);
      cells.push({ date: d, inMonth: false });
    } else if (dayNum > daysInMonth) {
      const d = new Date(year, month + 1, dayNum - daysInMonth);
      cells.push({ date: d, inMonth: false });
    } else {
      const d = new Date(year, month, dayNum);
      cells.push({ date: d, inMonth: true });
    }
  }
  return cells;
}

export default function SoftDatePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  className = "",
}) {
  const inputRef = useRef(null);
  const popRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => fromISO(value) || null, [value]);
  const [month, setMonth] = useState(() => selected || new Date());

  useEffect(() => {
    if (selected) setMonth(selected);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const closeOnClickOutside = (e) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnClickOutside);
    return () => document.removeEventListener("mousedown", closeOnClickOutside);
  }, [open]);

  const cells = buildCalendar(
    new Date(month.getFullYear(), month.getMonth(), 1)
  );

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className={`relative ${className}`}>
      {/* Display input */}
      <button
        type="button"
        ref={inputRef}
        onClick={() => setOpen((v) => !v)}
        className="
          w-full rounded-2xl border border-violet-100 bg-white/95
          px-4 py-3 pr-12 text-left text-sm text-slate-700 placeholder-slate-400 shadow-sm
          focus:outline-none focus:border-violet-300 focus:ring focus:ring-violet-200/70
          flex items-center justify-between
        "
      >
        <span className={`truncate ${value ? "" : "text-slate-400"}`}>
          {selected ? toDisplay(selected) : placeholder}
        </span>
        <span
          className="
            ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg
            bg-violet-50 text-violet-500
          "
        >
          <Calendar size={18} />
        </span>
      </button>

      {/* Popover – right aligned */}
      {open && (
        <div
          ref={popRef}
          className="
            absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl bg-white
            border border-violet-100 ring-1 ring-violet-100 shadow-xl p-3
          "
        >
          {/* Month header */}
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="text-sm font-medium text-slate-800">
              {month.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1)
                  )
                }
                className="rounded-lg p-1.5 text-slate-600 hover:bg-violet-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1)
                  )
                }
                className="rounded-lg p-1.5 text-slate-600 hover:bg-violet-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-1 px-1 text-center text-[11px] text-slate-500">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="mt-1 grid grid-cols-7 gap-1 px-1">
            {cells.map(({ date, inMonth }, i) => {
              const selectedDay = selected && isSameDay(date, selected);
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    onChange?.(toISO(date));
                    setOpen(false);
                  }}
                  className={`
                    h-9 rounded-md text-sm
                    ${inMonth ? "text-slate-800" : "text-slate-400"}
                    ${
                      selectedDay
                        ? "bg-violet-500 text-white"
                        : "hover:bg-violet-50"
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-2 flex items-center justify-between px-1 text-xs">
            <button
              type="button"
              onClick={() => onChange?.("")}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-violet-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange?.(toISO(today));
                setMonth(today);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-violet-50"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
