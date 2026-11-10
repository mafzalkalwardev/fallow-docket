import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-source",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-display-face",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fallow-docket.apps.grok.bot"),
  title: "Fallow Docket",
  description:
    "Look up older US motor-carrier dockets: legal name, MC number, USDOT, phone, email, fleet counts, and drivers from public FMCSA files.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fallow Docket",
    description:
      "Look up older US motor-carrier dockets from the public FMCSA files.",
    url: "https://fallow-docket.apps.grok.bot",
    siteName: "Fallow Docket",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${source.variable} ${display.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
