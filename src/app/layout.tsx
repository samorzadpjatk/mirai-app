import "@radix-ui/themes/styles.css";

import "~/styles/globals.css";
import "~/styles/light_theme.css"
import "~/styles/dark_theme.css"

import { type Metadata } from "next";

import { Roboto_Slab, IBM_Plex_Sans } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Container, Theme } from "@radix-ui/themes";
import { ThemeProvider } from 'next-themes';
import TopBar from "./_components/top_bar";
import ImageAdnotation from "./_components/image_adnotation";

export const metadata: Metadata = {
  title: "Bank Monet",
  description: "Bank Monet - Integral 2025",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  themeColor: "#dc2626",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bank Monet",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Bank Monet",
    title: "Bank Monet - Integral 2025",
    description: "Bank Monet - Integral 2025 Progressive Web App",
  },
  twitter: {
    card: "summary",
    title: "Bank Monet - Integral 2025",
    description: "Bank Monet - Integral 2025 Progressive Web App",
  },
};


const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-robotoslab",
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibmplex",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
  <html lang="en" className={`${robotoSlab.variable} ${ibmPlex.variable}`}> 
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bank Monet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="mask-icon" href="/icon-192x192.png" color="#dc2626" />
      </head>
      <body>
        <TRPCReactProvider>
          <ThemeProvider attribute="class">
            <Theme accentColor="red" panelBackground="solid">
              <TopBar />
              <Container align={"center"} style={{ fontFamily: 'var(--font-ibmplex)', backgroundImage: "url('/background.jpg')", backgroundSize: 'cover', backgroundColor: 'rgba(0, 0, 0, 0.7)', backgroundBlendMode: 'darken', width: '100vw', minHeight: '100vh' }}>
                {children}
              </Container>
              <ImageAdnotation />
            </Theme>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}


