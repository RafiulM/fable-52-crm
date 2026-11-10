import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "cn";

// Naik/turun dibanding pembanding. Arah ditulis dengan kata dan ikon,
// tidak hanya warna. `amount` adalah besar perubahannya, mis. "14,9%".
export function Delta({
  diff,
  amount,
  children,
  className,
}: {
  diff: number;
  amount: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const tone = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
  const word = tone === "up" ? "Naik" : tone === "down" ? "Turun" : "Tetap";

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1 text-[13px] leading-[1.38]",
        tone === "up" && "text-positive",
        tone === "down" && "text-destructive",
        tone === "flat" && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-[15px]" aria-hidden="true" />
      <span className="font-semibold">
        {word}
        {tone !== "flat" && <> {amount}</>}
      </span>
      {children && <span className="text-muted-foreground">{children}</span>}
    </p>
  );
}
