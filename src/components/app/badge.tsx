import { cn } from "cn";

// Label kecil berbentuk pil, mis. "Teratas", "Baru", "Aktif".
export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-strong bg-card px-2 text-xs leading-[1.6] font-semibold whitespace-nowrap [&_svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}
