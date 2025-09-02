import "@radix-ui/themes/styles.css";

import "~/styles/globals.css";
import "~/styles/light_theme.css"
import "~/styles/dark_theme.css"

import { type Metadata, type Viewport } from "next";

import { Roboto_Slab, IBM_Plex_Sans } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Container, Flex, ScrollArea, Theme } from "@radix-ui/themes";
import { ThemeProvider } from 'next-themes';
import TopBar from "~/components/TopBar";
import BackgroundImage from "~/components/BackgroundImage";

export const metadata: Metadata = {
  title: "Bank Monet",
  description: "Bank Monet - Integral 2025",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
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

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
    <html lang="en" className={`${robotoSlab.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bank Monet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Bank Monet" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-TileImage" content="/GRAL192.png" />
        <link rel="apple-touch-icon" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/GRAL192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/GRAL192.png" />
        <link rel="apple-touch-icon-precomposed" href="/GRAL192.png" />
        <link rel="mask-icon" href="/GRAL192.png" color="#dc2626" />
      </head>
      <body>
        <TRPCReactProvider>
          <ThemeProvider attribute="class">
            <Theme panelBackground={"translucent"} accentColor="red" grayColor="gray" style={{ fontFamily: 'var(--font-ibmplex)' }}>
              <Container size="3" style={{ height: '100%', margin: '0', padding: '0.5em' }}>
                <TopBar />
                <ScrollArea type="scroll">
                  <Flex style={{ width: '100%', height: "90vh", marginTop: '0.5em' }} direction={"column"} align={"center"} gap={"1"}>
                    {children}
                  </Flex>
                </ScrollArea>
              </Container>
              <BackgroundImage />
            </Theme>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}


