import type { Metadata } from "next";
import { ClientRouter } from "@/router/ClientRouter";

// Every app URL lands here; TanStack Router picks the view in the browser
// (src/router/). The four pages are prerendered; any other path still renders
// (TanStack shows the "no signal" page for it).

/** Titles for the first load and for link previews; the app keeps them in step with the language after that. */
const TITLES: Record<string, string> = { listen: "Listen", "then-now": "Then vs Now", how: "How we know" };

export function generateStaticParams() {
  return [{ path: [] }, ...Object.keys(TITLES).map((page) => ({ path: [page] }))];
}

export async function generateMetadata({ params }: PageProps<"/[[...path]]">): Promise<Metadata> {
  const { path } = await params;
  const title = path?.length === 1 ? TITLES[path[0]] : undefined;
  return title ? { title } : {};
}

export default function AppPage() {
  return <ClientRouter />;
}
