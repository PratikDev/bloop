"use client";

import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { PAGE_PATHS } from "@/router/modes";
import { useT } from "../../AppState/use-app-state";
import { JukeboxArt } from "../../JukeboxArt";

/** Any unknown address: the jukebox with its plug pulled, and the way back to the map. */
export function NotFoundPage() {
  const t = useT();
  return (
    <section aria-labelledby="not-found-title" className="flex min-h-full flex-col items-center justify-center gap-8 px-6 py-8 lg:flex-row lg:gap-16">
      <JukeboxArt marquee={t("notFound.title")} unplugged className="w-full max-w-[min(24rem,50dvh)]" />
      <div className="max-w-md space-y-5">
        <h1 id="not-found-title" data-page-title tabIndex={-1} className="display-tight font-wide text-headline">
          {t("notFound.title")}
        </h1>
        <p className="text-lead text-haze">{t("notFound.text")}</p>
        <Link to={PAGE_PATHS.listen} className="inline-flex h-12 items-center gap-3 key border-navy rounded-full bg-moon px-5 text-body text-ink">
          {t("notFound.back")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
