import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Geist, Geist_Mono, Instrument_Serif, Tiro_Bangla } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Latin faces for the interface; the Bangla faces cover Bengali glyphs only
// (their unicode-range means they download only when Bangla text is on screen).
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const anek = Anek_Bangla({ variable: "--font-anek", subsets: ["bengali"], preload: false });
const tiro = Tiro_Bangla({ variable: "--font-tiro", subsets: ["bengali"], weight: "400", style: ["normal", "italic"], preload: false });

export const metadata: Metadata = {
  title: { default: "Earth Information Jukebox", template: "%s · Earth Information Jukebox" },
  description: "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.",
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
