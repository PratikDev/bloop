import { cn } from "@/lib/utils";

const BARS = ["h-1.5", "h-3.5", "h-2.5"] as const;

/** The "this one" mark on a chosen record: three bars. Decorative; the record says it is chosen in words. */
export function Equaliser({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex h-4 items-end gap-0.5", className)}>
      {BARS.map((height, i) => (
        <span key={i} className={cn("w-1 rounded-xs bg-moon", height)} />
      ))}
    </span>
  );
}
