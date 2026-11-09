import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Archivo } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appEn } from "@/lib/i18n/en/app";
import "./globals.css";

// Archivo for the interface, with its width axis (wide display, condensed strip titles).
// Anek Bangla covers Bengali glyphs only (its unicode-range means it downloads only when Bangla text is on screen).
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const anek = Anek_Bangla({ variable: "--font-anek", subsets: ["bengali"], axes: ["wdth"], preload: false });

const DESCRIPTION = "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.";

export const metadata: Metadata = {
  // Absolute URLs for link previews (the Space Apps submission, Discord, social posts).
  metadataBase: new URL("https://bloop-ptsd.pages.dev"),
  title: { default: `${appEn["app.title"]}: the Earth Information Jukebox`, template: `%s · ${appEn["app.title"]}` },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: appEn["app.title"],
    title: `${appEn["app.title"]}: the Earth Information Jukebox`,
    description: DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Bloop: a globe of today's ocean temperature beside the words Listen to Earth's latest frames" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#CFE9DF",
};

const FONT_VARIABLES = [archivo, anek].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${FONT_VARIABLES} h-full`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
