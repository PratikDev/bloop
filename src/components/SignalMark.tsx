import { cn } from "@/lib/utils";

/** The logo: a point on the Earth sending out rings, like the cursor on the map. Decorative. */
export function SignalMark({ className, live = true }: { className?: string; live?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-grid place-items-center", className)}>
      {live && <span className="absolute inset-[22%] animate-signal-pulse rounded-full border border-shapla" />}
      <span className="absolute inset-[18%] rounded-full border border-line" />
      <span className="size-[30%] rounded-full bg-shapla shadow-glow" />
    </span>
  );
}
