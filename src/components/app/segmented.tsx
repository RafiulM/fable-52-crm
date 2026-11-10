"use client";

import { cn } from "cn";

// Pilihan satu-dari-beberapa berbentuk tombol berjajar (mis. Hari ini /
// Minggu ini / Bulan ini). Pilihan aktif ditandai aria-pressed.
export function Segmented<Value extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: Value;
  options: { value: Value; label: React.ReactNode }[];
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-md border border-border-strong p-1",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="rounded-sm px-3 py-1 text-[13px] leading-[1.6] font-semibold whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
