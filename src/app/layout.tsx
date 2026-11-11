import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Archivo, Atkinson_Hyperlegible, Hind_Siliguri, Noto_Sans_Bengali } from "next/font/google";
import { LANG_SCRIPT } from "@/components/AppState/lang-script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appEn } from "@/lib/i18n/en/app";
import { recordsEn } from "@/lib/i18n/en/records";
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
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Bloop: today's ocean temperature on a globe inside a jukebox window, beside the words Hear Earth's ocean and rain" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#CFE9DF",
};

// Low-vision mode's fonts (all SIL OFL 1.1, docs/accessibility/LICENCES.md): Atkinson Hyperlegible (Braille Institute)
// for Latin text, and two large, clear Bangla faces. Not preloaded: each downloads only once its setting puts it on screen.
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"], preload: false });
const notoBn = Noto_Sans_Bengali({ variable: "--font-noto-bn", subsets: ["bengali"], preload: false });
const hindBn = Hind_Siliguri({ variable: "--font-hind-bn", subsets: ["bengali"], weight: ["400", "600"], preload: false });

const FONT_VARIABLES = [archivo, anek, atkinson, notoBn, hindBn].map((f) => f.variable).join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets lang from the saved language before the body is parsed (mentor item 3), so the attribute
    // can differ from this HTML's "en" by the time React hydrates: that one difference is expected.
    <html lang="en" className={`${FONT_VARIABLES} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <noscript>
          <div className="mx-auto max-w-xl space-y-3 p-8 text-body text-moon">
            <p className="font-wide text-title">{appEn["app.title"]}</p>
            <p>{recordsEn["app.noscript"]}</p>
            <p>{DESCRIPTION}</p>
            <a href="https://github.com/PratikDev/bloop#readme" className="underline underline-offset-4">
              {recordsEn["app.noscriptReadme"]}
            </a>
          </div>
        </noscript>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
