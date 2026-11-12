import type { Ref } from "react";

/** A small record: navy disc, two groove rings, a coral label with an off-centre notch so a spin shows. Decorative. */
export function VinylMark({ className, ref }: { className?: string; ref?: Ref<SVGSVGElement> }) {
  return (
    <svg ref={ref} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" className="fill-navy" />
      <circle cx="16" cy="16" r="12" fill="none" strokeWidth="1" className="stroke-navy-soft" />
      <circle cx="16" cy="16" r="9.5" fill="none" strokeWidth="1" className="stroke-navy-soft" />
      <circle cx="16" cy="16" r="6" className="fill-coral" />
      <circle cx="18.5" cy="13.5" r="1.25" className="fill-navy" />
    </svg>
  );
}
