import "@radix-ui/themes/styles.css";

import "~/styles/globals.css";
import "~/styles/light_theme.css"
import "~/styles/dark_theme.css"

import { type Metadata } from "next";

import { Roboto_Slab, IBM_Plex_Sans } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Container, Flex, Theme } from "@radix-ui/themes";
import { ThemeProvider } from 'next-themes';
import TopBar from "./_components/top_bar";
import ImageAdnotation from "./_components/image_adnotation";

export const metadata: Metadata = {
  title: "Bank Monet",
  description: "Bank Monet - Integral 2025",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      <body>
        <TRPCReactProvider>
          <ThemeProvider attribute="class">
            <Theme accentColor="red" style={{ fontFamily: 'var(--font-ibmplex)', backgroundImage: "url('/background.jpg')", backgroundSize: 'cover', backgroundColor: 'var(--color-background)', backgroundBlendMode: 'color-burn', width: '100vw', height: '100vh' }}>
              <Container size="3" style={{ height: '100%', margin: '0', padding: '1em' }}>
                <TopBar />
                <Flex style={{ height: '100%'}} direction={"column"} align={"center"} justify={"center"} gap={"1"}>
                  {children}
                </Flex>
              </Container>
              <ImageAdnotation />
            </Theme>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}


