import type { Metadata } from "next";
import { ClientRouter } from "@/router/ClientRouter";

// Every app URL lands here; TanStack Router picks the view in the browser
// (src/router/). The seven pages are prerendered; any other path still renders
// (TanStack shows the "no signal" page for it).

/** Titles for the first load and for link previews; the app keeps them in step with the language after that. */
const TITLES: Record<string, string> = { listen: "Listen", "then-now": "Then vs Now", how: "How we know", official: "Official records", turntable: "Turntable", team: "Team", transcript: "Transcript", "data-health": "Data health" /* DATA */ };

/** Pages with no link to them (the listener test, mentor item 8): prerendered, kept out of search engines. */
const HIDDEN: Record<string, string> = { "listen-test": "Listening test" };

export function generateStaticParams() {
  return [{ path: [] }, ...[...Object.keys(TITLES), ...Object.keys(HIDDEN)].map((page) => ({ path: [page] }))];
}

export async function generateMetadata({ params }: PageProps<"/[[...path]]">): Promise<Metadata> {
  const { path } = await params;
  const page = path?.length === 1 ? path[0] : undefined;
  if (page && HIDDEN[page]) return { title: HIDDEN[page], robots: { index: false, follow: false } };
  const title = page ? TITLES[page] : undefined;
  return title ? { title } : {};
}

export default function AppPage() {
  return <ClientRouter />;
}
