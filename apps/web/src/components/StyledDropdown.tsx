'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type DropdownOption = {
  label: string;
  value: string;
};

type StyledDropdownProps = {
  value: string;
  options: DropdownOption[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function StyledDropdown({
  value,
  options,
  placeholder,
  disabled,
  onChange,
}: StyledDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? '';
  }, [options, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-left text-sm text-white transition hover:border-white/30 disabled:cursor-not-allowed disabled:text-neutral-500"
      >
        <span>{selectedLabel || placeholder}</span>
        <span className="text-xs text-neutral-400">{open ? '▲' : '▼'}</span>
      </button>
      {open ? (
        <div className="absolute left-0 z-20 mt-2 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-neutral-950/95 p-1 shadow-xl shadow-black/50">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-300 transition hover:bg-white/10"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                value === option.value ? 'text-emerald-200' : 'text-white/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
