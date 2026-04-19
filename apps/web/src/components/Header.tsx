'use client'

import { memo, useMemo, useCallback } from 'react'
import { XStack, YStack, Text, Button } from '@mirai-app/ui'
import { ChevronLeft, LogOut } from 'lucide-react'
import { TripSelector } from './TripSelector'
import { authClient } from '../lib/auth'

interface HeaderProps {
  currentPath: string
}

// Map paths to page titles (for non-dashboard pages)
const pageTitles: Record<string, string> = {
  '/users': 'Users',
  '/groups': 'Groups',
  '/challenges': 'Challenges',
  '/rewards': 'Rewards',
  '/notifications': 'Notifications',
  '/schedules': 'Schedules',
  '/transactions': 'Transactions',
  '/coins': 'Coins',
  '/activity': 'Activity',
}

/**
 * Header component with navigation, trip selector, and user info.
 * Displays differently on dashboard vs other pages.
 */
export const Header = memo(function Header({ currentPath }: HeaderProps) {
  const isDashboard = currentPath === '/'
  const pageTitle = useMemo(() => pageTitles[currentPath], [currentPath])

  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  const navigateHome = useCallback(() => {
    window.location.href = '/'
  }, [])

  return (
    <YStack>
      <XStack
        height={64}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        $md={{ paddingHorizontal: '$6' }}
        borderBottomWidth={1}
        borderColor="$borderColor"
        backgroundColor="$backgroundHover"
        role="banner"
        aria-label="Application header"
      >
        {/* Left side: Logo or Back + Page title */}
        <XStack alignItems="center" gap="$4">
          {isDashboard ? (
            <Button
              onPress={navigateHome}
              variant="ghost"
              size="lg"
              accessibilityLabel="Go to dashboard"
            >
              <img
                src="/mirai_logo.png"
                alt="Mirai"
                style={{ height: 40, width: 'auto', display: 'block' }}
              />
            </Button>
          ) : (
            <>
              <Button
                onPress={navigateHome}
                variant="ghost"
                size="lg"
                leftIcon={<ChevronLeft size={22} />}
                accessibilityLabel="Go back to dashboard"
              >
                <Text fontSize="$3" display="none" $sm={{ display: 'flex' }}>
                  Back
                </Text>
              </Button>
              {pageTitle && (
                <Text fontSize="$6" fontWeight="700" color="$color">
                  {pageTitle}
                </Text>
              )}
            </>
          )}
        </XStack>

        {/* Right side: Trip switcher, profile name, logout */}
        <XStack alignItems="center" gap="$4">
          <YStack display="none" $sm={{ display: 'flex' }}>
            <TripSelector />
          </YStack>

          {/* User info placeholder - will be populated by auth context */}
          <Text fontSize="$3" color="$colorMuted" display="none" $md={{ display: 'flex' }}>
            Admin
          </Text>

          <Button
            variant="ghost"
            size="lg"
            leftIcon={<LogOut size={20} />}
            onPress={handleLogout}
            accessibilityLabel="Sign out"
          >
            <Text fontSize="$3" color="$colorMuted" display="none" $md={{ display: 'flex' }}>
              Logout
            </Text>
          </Button>
        </XStack>
      </XStack>

      {/* Trip switcher on mobile - always visible below header */}
      <YStack
        display="flex"
        $sm={{ display: 'none' }}
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderTopWidth={1}
        borderColor="$borderColor"
        backgroundColor="$backgroundHover"
      >
        <TripSelector />
      </YStack>
    </YStack>
  )
})
