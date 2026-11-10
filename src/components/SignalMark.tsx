import { cn } from "@/lib/utils";

/** The logo: a point on the Earth inside a ring, like the cursor on the map. Still (no pulse: motion item 19). Decorative. */
export function SignalMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-grid place-items-center", className)}>
      <span className="absolute inset-[18%] rounded-full border border-line" />
      <span className="size-[30%] rounded-full bg-shapla" />
    </span>
  );
}
