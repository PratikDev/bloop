import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Tiro_Bangla } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const anek = Anek_Bangla({
  variable: "--font-anek",
  subsets: ["latin", "bengali"],
  axes: ["wdth"],
});

const tiro = Tiro_Bangla({
  variable: "--font-tiro",
  subsets: ["latin", "bengali"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Earth Information Jukebox",
  description: "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anek.variable} ${tiro.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
