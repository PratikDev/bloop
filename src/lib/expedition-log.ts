export interface LogEntry {
  at: string;
  text: string;
  sources: string[];
}

const LOG_MAX = 200;

export function addEntry(log: readonly LogEntry[], entry: LogEntry): LogEntry[] {
  return [...log, entry].slice(-LOG_MAX);
}

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

const logSources = (log: readonly LogEntry[]) => [...new Set(log.flatMap((e) => e.sources))];

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
