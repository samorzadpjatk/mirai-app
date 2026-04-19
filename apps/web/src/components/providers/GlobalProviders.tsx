'use client'

import { TamaguiProvider } from '@mirai-app/ui'
import { config } from '@mirai-app/ui/tamagui.config'
import { Toaster } from 'react-hot-toast'
import { Header } from '../Header'
import { MobileNav } from '../MobileNav'
import { Sidebar } from '../Sidebar'
import { PageContent } from './PageContent'
import { GraphQLProvider } from './GraphQLProvider'
import { TripProvider } from '@/contexts/TripContext'
import { YStack, XStack } from '@mirai-app/ui'

interface GlobalProvidersProps {
  currentPath: string
  page: string
  pageProps?: Record<string, string>
}

/**
 * GlobalProviders - Provides the shared authenticated admin shell for every page island.
 *
 * This keeps auth, trip context, header, sidebar, and mobile nav in one
 * persistent client island so page content can be code-split per route.
 *
 * Provider hierarchy:
 * - TamaguiProvider: Theme and UI tokens
 * - GraphQLProvider: GraphQL client with auth integration
 * - TripProvider: Trip selection context with localStorage persistence
 */
export default function GlobalProviders({
  currentPath,
  page,
  pageProps = {},
}: GlobalProvidersProps) {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <GraphQLProvider>
        <TripProvider>
          <YStack flex={1} minHeight="100vh" backgroundColor="$background">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: '#1b2828',
                  color: '#ffffff',
                },
              }}
            />
            <Header currentPath={currentPath} />

            <XStack flex={1} overflow="hidden">
              {/* Desktop Sidebar - hidden on mobile */}
              <YStack
                display="none"
                $gtSm={{ display: 'flex' }}
                width={256}
                borderRightWidth={1}
                borderColor="$borderColor"
                backgroundColor="$backgroundHover"
              >
                <Sidebar currentPath={currentPath} />
              </YStack>

              {/* Main Content Area */}
              <YStack flex={1} overflow="scroll">
                <YStack flex={1} padding="$4" $gtSm={{ padding: '$6' }}>
                  <PageContent page={page} pageProps={pageProps} />
                </YStack>
              </YStack>
            </XStack>

            <MobileNav currentPath={currentPath} />
          </YStack>
        </TripProvider>
      </GraphQLProvider>
    </TamaguiProvider>
  )
}
