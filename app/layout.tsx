import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://estadisticas.datalogia.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Estadísticas Argentinas — Datalogía",
    template: "%s · Estadísticas Argentinas",
  },
  description:
    "Indicadores macroeconómicos y sociales de Argentina con datos oficiales de INDEC, BCRA, MECON y otras fuentes.",
  keywords: [
    "Argentina",
    "estadísticas",
    "inflación",
    "IPC",
    "dólar",
    "INDEC",
    "BCRA",
    "macroeconomía",
    "Datalogía",
  ],
  authors: [{ name: "Datalogía", url: "https://datalogia.app" }],
  creator: "Datalogía",
  publisher: "Datalogía",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Estadísticas Argentinas",
    title: "Estadísticas Argentinas — Datalogía",
    description:
      "Indicadores macroeconómicos y sociales de Argentina con datos oficiales.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Estadísticas Argentinas — Datalogía",
    description:
      "Indicadores macroeconómicos y sociales de Argentina con datos oficiales.",
  },
  // Next.js detecta automáticamente app/icon.png como favicon en todos los
  // tamaños. No declaramos icons aquí para evitar duplicar/contradecir.
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch{}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
