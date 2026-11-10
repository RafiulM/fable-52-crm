import { cn } from "cn";

// Pita ringkasan: beberapa angka berdampingan dalam satu bingkai, dipisah
// garis tipis. Menjadi satu kolom saat halaman sempit.
export function SummaryBand({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border @min-[900px]/page:grid-cols-3",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SummaryCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2 bg-card p-6">
      {children}
    </div>
  );
}

export function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-[1.23] font-semibold tracking-[0.01em] text-muted-foreground">
      {children}
    </p>
  );
}

export function MetricValue({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[25px] leading-[1.2] [overflow-wrap:anywhere]">
      {children}
    </p>
  );
}
