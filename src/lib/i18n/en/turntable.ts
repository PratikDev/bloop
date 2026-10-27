// English strings for Turntable Earth (prototype). Bangla falls back to these
// until a human translation exists (docs/L3/bangla-strings.md).

import { formatInteger } from "../format";

export const turntableEn = {
  "mode.turntable": "Turntable",

  "turntable.roleDescription": "turntable",
  "turntable.region": (p: { record: string }) => `Turntable Earth, playing the ${p.record} record`,
  "turntable.instructions":
    "Left and right arrows turn the globe 1 degree, up and down move the needle 1 degree; with Shift, 10. " +
    "Space starts or stops the turning. Enter speaks the value under the needle. R changes the record. Esc goes back to the flat map.",
  "turntable.canvas": (p: { record: string }) =>
    `A globe on a turntable showing the latest available ${p.record} frame. A tonearm's needle reads the point beneath it.`,

  "turntable.records": "Records",
  "turntable.record.ocean": "Ocean",
  "turntable.record.rain": "Rain",
  "turntable.record.both": "Ocean + Rain",
  "turntable.record.air": "Air",
  "turntable.record.forests": "Forests",
  "turntable.record.fire": "Fire",
  "turntable.record.energy": "Energy",
  "turntable.record.seaLevel": "Sea level",
  "turntable.record.disasters": "Disasters",
  "turntable.record.agriculture": "Agriculture",
  "turntable.record.water": "Water and groundwater",
  "turntable.comingNext": "Coming next",

  // Record labels: every value comes from sst.json / rain.json; "—" when a field is missing.
  "turntable.missing": "—",
  "turntable.frameTime": (p: { datetime: string }) => `Frame: ${p.datetime} UTC`,
  "turntable.age": (p: { days: number | null }) =>
    p.days === null
      ? "Latest available: —"
      : p.days < 1
        ? "Latest available: less than a day old"
        : `Latest available: ${formatInteger(p.days, "en")} ${p.days === 1 ? "day" : "days"} old`,
  "turntable.error": (p: { text: string }) => `Measured error: ${p.text}`,
  "turntable.error.rain": (p: { percent: number }) => `typically within ~${formatInteger(p.percent, "en")}% (pending team approval)`,

  "turntable.turn": "Turn",
  "turntable.stopTurning": "Stop turning",
  "turntable.slower": "Slower",
  "turntable.faster": "Faster",
  "turntable.speed": (p: { speed: number }) => `Speed ${p.speed}×`,
  "turntable.flatMap": "Flat map",

  "turntable.announce.record": (p: { record: string; frames: string }) => `Record: ${p.record}. ${p.frames}`,
  "turntable.announce.frame": (p: { product: string; datetime: string }) =>
    `${p.product}, latest available frame ${p.datetime} UTC.`,
  "turntable.announce.turning": "Turning",
  "turntable.announce.stoppedTurning": "Turning stopped",
  "turntable.stopped": "Stopped. Back to the flat map.",

  "caption.earcon.needleDrop": "Needle drop: a new record",

  "help.turntable": "On the turntable",
  "key.tt.leftRight": "Left / Right",
  "key.tt.leftRight.action": "Turn the globe 1 degree (with Shift: 10 degrees); stops the turning",
  "key.tt.upDown": "Up / Down",
  "key.tt.upDown.action": "Move the needle 1 degree north or south (with Shift: 10 degrees), up to 80 degrees",
  "key.tt.space.action": "Start or stop the turning",
  "key.tt.enter.action": "Speak the value and the place under the needle",
  "key.tt.r.action": "Next / previous record",
  "key.tt.123.action": "Ocean, Rain, or Ocean + Rain record",
  "key.tt.plusMinus.action": "Turn faster / slower",
  "key.tt.esc.action": "Stop all sound and go back to the flat map",
};
