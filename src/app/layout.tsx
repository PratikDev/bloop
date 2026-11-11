import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Atkinson_Hyperlegible, Geist, Geist_Mono, Hind_Siliguri, Instrument_Serif, Noto_Sans_Bengali, Tiro_Bangla } from "next/font/google";
import { LANG_SCRIPT } from "@/components/AppState/lang-script";
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

export const metadata: Metadata = {
  title: { default: appEn["app.title"], template: `%s · ${appEn["app.title"]}` },
  description: "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#120c20",
};

// Low-vision mode's fonts (all SIL OFL 1.1, docs/accessibility/LICENCES.md): Atkinson
// Hyperlegible (Braille Institute) for Latin text, and two large, clear Bangla candidates. Not preloaded: each
// downloads only once its setting puts it on screen.
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"], preload: false });
const notoBn = Noto_Sans_Bengali({ variable: "--font-noto-bn", subsets: ["bengali"], preload: false });
const hindBn = Hind_Siliguri({ variable: "--font-hind-bn", subsets: ["bengali"], weight: ["400", "600"], preload: false });

const FONT_VARIABLES = [geist, geistMono, instrument, anek, tiro, atkinson, notoBn, hindBn].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets lang from the saved language before the body is parsed, so the attribute
    // can differ from this HTML's "en" by the time React hydrates: that one difference is expected.
    <html lang="en" className={`${FONT_VARIABLES} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
