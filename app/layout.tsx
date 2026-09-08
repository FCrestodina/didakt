import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

// Misma tipografía que crestech-web, para que el sub-sitio se lea como parte
// de la marca y no como otro producto.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://didactico.crestech.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Crestech Didáctico — Secuencias didácticas para el aula",
    template: "%s — Crestech Didáctico",
  },
  description:
    "Las secuencias didácticas que desarrollamos en Crestech, en un solo lugar: recursos web listos para usar en clase, con su manual del docente.",
  openGraph: {
    siteName: "Crestech Didáctico",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full antialiased ${instrumentSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
