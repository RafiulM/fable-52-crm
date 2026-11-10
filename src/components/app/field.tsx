import { CircleAlert } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDigits } from "@/lib/format";

// Satu isian form: label, kontrol, petunjuk, dan pesan salah.
// Pasang `fieldAria(id, hint, error)` pada kontrolnya supaya pembaca layar
// membacakan petunjuk dan pesan salah.
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid min-w-0 content-start gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-[13px] text-destructive"
        >
          <CircleAlert className="size-3.5 flex-none" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldAria(id: string, hint?: unknown, error?: string) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");
  return {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

// Isian nominal rupiah: menampilkan titik ribuan sambil diketik.
// `value` adalah teks berformat (mis. "2.750.000"); ambil angkanya dengan
// Number(onlyDigits(value)).
export function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <span className="relative block">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground"
      >
        Rp
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onValueChange(formatDigits(event.target.value))}
        className={cn("pl-10 font-mono", className)}
        {...props}
      />
    </span>
  );
}
