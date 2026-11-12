"use client";

import { useT } from "./AppState/use-app-state";
import { StatusBadge } from "./StatusBadge";

/**
 * A page or feature whose code is still on its way: the site's loading badge (the spinning record and a line of text),
 * filling the space the page will take, so nothing shifts when it arrives.
 */
export function PageLoading({ className }: { className?: string }) {
  const t = useT();
  return (
    <div className={className ?? "grid min-h-full place-items-center p-6"}>
      <StatusBadge kind="loading">{t("page.loading")}</StatusBadge>
    </div>
  );
}
