import type { ThenNowInput, WindowSeries } from "@/lib/audio";

interface InputSummaryProps {
  input: ThenNowInput;
}

const range = (w: WindowSeries) => {
  const min = Math.min(...w.values);
  const max = Math.max(...w.values);
  return `${w.label}: ${w.values.length} values, ${min.toFixed(2)} … ${max.toFixed(2)}`;
};

/** What the players will actually play: window labels, value ranges, water coverage, captions. */
export default function InputSummary({ input }: InputSummaryProps) {
  const { water } = input;
  const missing = water.cm.filter((v) => v === null).length;
  const rows: [string, string][] = [
    ["heat (°C anomaly)", `${range(input.heat.A)} | ${range(input.heat.B)}`],
    ["monsoon (mm/day)", `${range(input.monsoon.A)} | ${range(input.monsoon.B)}`],
    ["water (cm)", `${water.months[0]} … ${water.months[water.months.length - 1]}: ${water.months.length} months, ${missing} missing; windows ${water.windowA.join("–")} and ${water.windowB.join("–")}`],
    ["heat caption", input.captions.heat],
    ["monsoon caption", input.captions.monsoon],
    ["water caption", input.captions.water],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground md:grid-cols-[auto_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
