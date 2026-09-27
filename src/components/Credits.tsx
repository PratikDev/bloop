import { cn } from "@/lib/utils";
import type { BoundT } from "@/lib/i18n";

/** Team plan §15 credits, always visible at the foot of the page. */
export function Credits({ t, className }: { t: BoundT; className?: string }) {
  return (
    <p className={cn("text-small text-haze", className)}>
      {t("credits.visualizations")} {t("credits.data")} {t("credits.testing")}
    </p>
  );
}
