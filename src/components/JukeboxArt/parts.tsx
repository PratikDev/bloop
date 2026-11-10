// The drawing's repeated pieces. Coordinates are in the 440 × 640 view box.

export const VIEW_W = 440;
export const VIEW_H = 640;
export const WINDOW = { cx: 220, cy: 270, r: 92 } as const;

const TUBE_TOP = 170;
const TUBE_HEIGHT = 390;
const TUBE_WIDTH = 26;
const TUBES = [
  { x: 48, fill: "fill-bubble" },
  { x: 80, fill: "fill-dial" },
  { x: 334, fill: "fill-dial" },
  { x: 366, fill: "fill-bubble" },
] as const;
const BUBBLES = [
  { dy: 70, r: 5 },
  { dy: 150, r: 4 },
  { dy: 245, r: 6 },
  { dy: 330, r: 4 },
] as const;

export function Tubes() {
  return (
    <>
      {TUBES.map(({ x, fill }) => (
        <g key={x}>
          <rect x={x} y={TUBE_TOP} width={TUBE_WIDTH} height={TUBE_HEIGHT} rx={TUBE_WIDTH / 2} strokeWidth="3" className={`${fill} stroke-navy`} />
          {BUBBLES.map(({ dy, r }) => (
            <circle key={dy} cx={x + TUBE_WIDTH / 2} cy={TUBE_TOP + dy} r={r} strokeWidth="1.5" className="fill-paper stroke-navy" />
          ))}
        </g>
      ))}
    </>
  );
}

const DOOR_TOP = 424;
const DOOR_HEIGHT = 142;
const DOOR_WIDTH = 98;
const SLOTS = 6;
const SLOT_WIDTH = 8;
const SLOT_STEP = 14;
const SLOT_INSET = 12;

function Door({ side, x }: { side: "left" | "right"; x: number }) {
  return (
    <g data-door={side}>
      <rect x={x} y={DOOR_TOP} width={DOOR_WIDTH} height={DOOR_HEIGHT} rx="6" strokeWidth="3" className="fill-sea-deep stroke-navy" />
      {Array.from({ length: SLOTS }, (_, i) => (
        <rect key={i} x={x + SLOT_INSET + i * SLOT_STEP} y={DOOR_TOP + SLOT_INSET} width={SLOT_WIDTH} height={DOOR_HEIGHT - SLOT_INSET * 2} rx="2" className="fill-navy" />
      ))}
    </g>
  );
}

/** The grille: two separate groups, so they can slide apart. */
export function Doors() {
  return (
    <>
      <Door side="left" x={120} />
      <Door side="right" x={222} />
    </>
  );
}

/** The pulled plug: a navy cord lying on the floor. */
export function Unplugged() {
  return (
    <g className="stroke-navy">
      <path d="M410 520 C 440 520 438 606 380 612 S 250 622 170 612" fill="none" strokeWidth="5" strokeLinecap="round" />
      <rect x="134" y="600" width="36" height="24" rx="4" strokeWidth="3" className="fill-navy" />
      <path d="M134 606 H118 M134 618 H118" fill="none" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

/** The coin the journey drops into the slot. */
export function Coin() {
  return <circle data-coin cx="220" cy="395" r="11" strokeWidth="3" className="fill-bubble stroke-navy" />;
}
