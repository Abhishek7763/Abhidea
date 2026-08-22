import type { Metadata } from "next";
import { Inter, Newsreader, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import "./globals.css";

const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const readerLatinFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-reader-latin",
  display: "swap",
});

const devanagariSansFont = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari-sans",
  display: "swap",
});

const devanagariSerifFont = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari-serif",
  display: "swap",
});

const fontVariables = [
  uiFont.variable,
  readerLatinFont.variable,
  devanagariSansFont.variable,
  devanagariSerifFont.variable,
].join(" ");

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("abhidea-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.dataset.theme = saved;
      document.documentElement.style.colorScheme = saved;
    }
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "ABHIDEA",
    template: "%s | ABHIDEA",
  },
  description: "Read • Learn • Think • Grow",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontVariables}>
        <Script id="abhidea-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
