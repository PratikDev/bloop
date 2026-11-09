import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Geist, Geist_Mono, Instrument_Serif, Tiro_Bangla } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appEn } from "@/lib/i18n/en/app";
import "./globals.css";

// Latin faces for the interface; the Bangla faces cover Bengali glyphs only
// (their unicode-range means they download only when Bangla text is on screen).
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const anek = Anek_Bangla({ variable: "--font-anek", subsets: ["bengali"], preload: false });
const tiro = Tiro_Bangla({ variable: "--font-tiro", subsets: ["bengali"], weight: "400", style: ["normal", "italic"], preload: false });

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
  colorScheme: "dark",
  themeColor: "#120c20",
};

const FONT_VARIABLES = [geist, geistMono, instrument, anek, tiro].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${FONT_VARIABLES} h-full`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
