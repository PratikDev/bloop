// The expedition log: a plain-text record of this session's places,
// values, comparisons and sources, readable on screen and saved as .txt. Lines wrap at the braille explorer's width
// setting, so a braille display shows whole lines.

export interface LogEntry {
  /** When it was said (ISO, UTC). */
  at: string;
  /** What was said, exactly as the app said it (values from slots, never retyped). */
  text: string;
  /** The datasets it came from (their names, as the registry gives them). */
  sources: string[];
}

/** The newest entries kept (a session is short; the log is a summary, not a recording). */
export const LOG_MAX = 200;

export function addEntry(log: readonly LogEntry[], entry: LogEntry): LogEntry[] {
  return [...log, entry].slice(-LOG_MAX);
}

/** Wraps text into lines of at most `width` characters, at spaces; a word longer than a line is cut. */
export function wrapLines(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/u).filter(Boolean)) {
    for (let w = word; w.length > 0; ) {
      if (line === "" && w.length > width) {
        lines.push(w.slice(0, width));
        w = w.slice(width);
        continue;
      }
      const next = line === "" ? w : `${line} ${w}`;
      if (next.length <= width) {
        line = next;
        w = "";
      } else {
        lines.push(line);
        line = "";
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Every distinct source, in the order first used. */
export const logSources = (log: readonly LogEntry[]) => [...new Set(log.flatMap((e) => e.sources))];

/**
 * The log as plain text: a title, one block per entry (its time, then its words), then the sources. `time` formats an
 * entry's time in the UI language; the labels come from the UI strings.
 */
export function logText(
  log: readonly LogEntry[],
  width: number,
  labels: { title: string; empty: string; sources: string },
  time: (iso: string) => string,
): string {
  const blocks = log.length === 0 ? [[labels.empty]] : log.map((e) => [time(e.at), ...wrapLines(e.text, width)]);
  const sources = logSources(log);
  const tail = sources.length === 0 ? [] : [[labels.sources, ...sources.flatMap((s) => wrapLines(`- ${s}`, width))]];
  return [[...wrapLines(labels.title, width)], ...blocks, ...tail].map((b) => b.join("\n")).join("\n\n") + "\n";
}
