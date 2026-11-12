"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { findByCode } from "@/lib/records";
import { useAnnounce } from "../Announcer/use-announcer";
import { useT } from "../AppState/use-app-state";
import { useRecords } from "../Records/use-records";
import { StatusBadge } from "../StatusBadge";

/** Pick a record by typing its code. A field, never a global key: B is Braille and S is Sweep. */
export function CodeEntry({ onPlayed }: { onPlayed?: () => void }) {
  const { records, play } = useRecords();
  const announce = useAnnounce();
  const t = useT();
  const id = useId();
  const [code, setCode] = useState("");
  const [missing, setMissing] = useState<string | null>(null);

  const submit = () => {
    const wanted = code.trim();
    if (!wanted) return;
    const record = findByCode(records, wanted);
    if (!record) {
      const text = t("records.code.none", { code: wanted.toUpperCase() });
      setMissing(text);
      announce(text);
      return;
    }
    setMissing(null);
    setCode("");
    play(record);
    onPlayed?.();
  };

  return (
    <form
      noValidate
      className="space-y-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Label htmlFor={id} className="text-small font-normal text-haze">
        {t("records.code")}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={code}
          onChange={(e) => {
            setCode(e.currentTarget.value);
            setMissing(null);
          }}
          placeholder={t("records.code.placeholder")}
          autoComplete="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-lg border-2 border-line bg-paper px-3 md:text-base"
        />
        <Button type="submit" variant="ghost" className="key border-navy h-11 rounded-lg bg-paper px-4 text-body text-moon hover:bg-paper">
          {t("records.code.play")}
        </Button>
      </div>
      {missing && <StatusBadge kind="error">{missing}</StatusBadge>}
    </form>
  );
}
