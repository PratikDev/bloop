"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useT } from "../../AppState/use-app-state";
import { DataCredits } from "../../DataCredits";

/** The NASA data credits, behind a button so the Team page stays about the team. */
export function DataCreditsDialog() {
  const t = useT();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="shrink-0" />}>{t("team.madeWith")}</DialogTrigger>
      <DialogContent closeLabel={t("inspector.close")} className="max-h-[85dvh] overflow-y-auto bg-dusk text-body sm:max-w-xl">
        <DialogTitle className="pr-10 font-wide text-title">{t("team.madeWith")}</DialogTitle>
        <DataCredits level={2} />
      </DialogContent>
    </Dialog>
  );
}
