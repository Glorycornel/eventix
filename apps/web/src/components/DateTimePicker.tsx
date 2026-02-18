'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type DateTimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (value: number) => String(value).padStart(2, '0');

const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const formatDisplay = (date: Date, time: string) => {
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
  return `${dateLabel} • ${time}`;
};

const toLocalParts = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
};

export function DateTimePicker({ label, value, onChange, required }: DateTimePickerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const initial = useMemo(() => (value ? toLocalParts(value) : null), [value]);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initial?.date ?? null);
  const [timeValue, setTimeValue] = useState(initial?.time ?? '');
  const [month, setMonth] = useState<Date>(() => {
    const base = initial?.date ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!value) {
      setSelectedDate(null);
      setTimeValue('');
      return;
    }
    const parts = toLocalParts(value);
    if (!parts) {
      return;
    }
    setSelectedDate(parts.date);
    setTimeValue(parts.time);
    setMonth(new Date(parts.date.getFullYear(), parts.date.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  const emitChange = (date: Date | null, time: string) => {
    if (!date || !isValidTime(time)) {
      return;
    }
    const next = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Number(time.slice(0, 2)),
      Number(time.slice(3, 5)),
    );
    onChange(next.toISOString());
  };

  const handleDateSelect = (day: number) => {
    const nextDate = new Date(month.getFullYear(), month.getMonth(), day);
    setSelectedDate(nextDate);
    const nextTime = timeValue || '09:00';
    if (!timeValue) {
      setTimeValue(nextTime);
    }
    emitChange(nextDate, nextTime);
  };

  const handleTimeChange = (value: string) => {
    setTimeValue(value);
    emitChange(selectedDate, value);
  };

  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const items: Array<number | null> = [];
    for (let i = 0; i < startOffset; i += 1) {
      items.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push(day);
    }
    while (items.length < 42) {
      items.push(null);
    }
    return items;
  }, [month]);

  const selectedDisplay =
    selectedDate && isValidTime(timeValue) ? formatDisplay(selectedDate, timeValue) : '';

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  const today = new Date();

  return (
    <div ref={wrapperRef} className="relative grid gap-2 text-sm">
      <label className="flex flex-col gap-2">
        {label}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-left text-sm text-white"
        >
          <span className={selectedDisplay ? '' : 'text-white/40'}>
            {selectedDisplay || 'Select date and time'}
          </span>
          <span className="text-xs text-white/50">Edit</span>
        </button>
      </label>
      {required ? (
        <span className="sr-only" aria-hidden={!required}>
          {selectedDisplay ? 'Selected' : 'Required'}
        </span>
      ) : null}
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-[18rem] rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
            >
              Prev
            </button>
            <span className="text-sm font-semibold text-white">{monthLabel}</span>
            <button
              type="button"
              onClick={() =>
                setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
            >
              Next
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-2 text-center text-sm">
            {cells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="h-8" />;
              }
              const isSelected =
                selectedDate?.getFullYear() === month.getFullYear() &&
                selectedDate?.getMonth() === month.getMonth() &&
                selectedDate?.getDate() === day;
              const isToday =
                today.getFullYear() === month.getFullYear() &&
                today.getMonth() === month.getMonth() &&
                today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`h-8 rounded-full text-sm transition ${
                    isSelected
                      ? 'bg-emerald-400/80 text-neutral-950'
                      : 'text-white/80 hover:bg-white/10'
                  } ${isToday && !isSelected ? 'border border-emerald-300/50' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Time</span>
            <input
              type="text"
              inputMode="numeric"
              value={timeValue}
              onChange={(event) => handleTimeChange(event.target.value)}
              placeholder="HH:MM"
              className="w-20 rounded-md border border-white/10 bg-neutral-950/60 px-2 py-1 text-center text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
