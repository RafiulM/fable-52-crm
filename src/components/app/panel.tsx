import { cn } from "cn";

// Blok bangunan halaman: judul halaman, panel putih berbingkai, dan teks bantu.
// Panel adalah container query bernama "panel", jadi isi bisa menyesuaikan
// lebar panelnya sendiri (bukan lebar layar).

export function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      {children}
    </header>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[25px] leading-[1.2] font-medium">{children}</h1>
  );
}

export function MutedText({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[13px] leading-[1.38] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Panel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "@container/panel grid min-w-0 content-start gap-4 rounded-lg border bg-card p-6",
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg leading-[1.22] font-medium", className)}
      {...props}
    />
  );
}
