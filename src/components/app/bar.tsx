import { cn } from "cn";

// Batang kemajuan mendatar. `value` dalam persen; di atas 100 tetap penuh.
export function Bar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-2.5 min-w-12 flex-1 overflow-hidden rounded-sm bg-border",
        className,
      )}
    >
      <span
        className="block h-full rounded-sm bg-foreground transition-[width] duration-200 motion-reduce:transition-none"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}
