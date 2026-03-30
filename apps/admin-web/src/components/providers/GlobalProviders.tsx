"use client";

import { APIProvider } from "@mirai-app/trpc/client";
import { AuthProvider } from "../AuthProvider";
import { TripProvider } from "../../contexts/TripContext";
import { Header } from "../Header";
import { MobileNav } from "../MobileNav";
import { PageContent } from "./PageContent";
import { Toaster } from "react-hot-toast";
import { env } from "../../lib/env";

interface GlobalProvidersProps {
  currentPath: string;
  page: string;
  pageProps?: Record<string, string>;
}

/**
 * Provides the shared authenticated admin shell for every page island.
 *
 * This keeps auth, tRPC, trip context, header, and mobile nav in one
 * persistent client island so page content can be code-split per route.
 */
export default function GlobalProviders({
  currentPath,
  page,
  pageProps = {},
}: GlobalProvidersProps) {
  return (
    <AuthProvider>
      <APIProvider httpUrl={env.trpcUrl} wsUrl={env.trpcWsUrl}>
        <TripProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "#1b2828",
                  color: "#ffffff",
                },
              }}
            />
            <Header currentPath={currentPath} />
            <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
              <PageContent page={page} pageProps={pageProps} />
            </main>
            <MobileNav currentPath={currentPath} />
          </div>
        </TripProvider>
      </APIProvider>
    </AuthProvider>
  );
}
