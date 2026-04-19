'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { XStack, YStack, Button, Sheet, Text } from '@mirai-app/ui'
import { Menu, X } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import {
  Home,
  Users,
  UserCircle,
  Trophy,
  Gift,
  Bell,
  Calendar,
  CreditCard,
  Coins,
  ClipboardList,
} from 'lucide-react'

// Type for icon component from lucide-react
type LucideIcon = React.ForwardRefExoticComponent<LucideProps>

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: Omit<NavItem, 'icon'>[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/groups', label: 'Groups' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/schedules', label: 'Schedules' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/coins', label: 'Coins' },
  { href: '/activity', label: 'Activities' },
]

const ICON_MAP: Record<string, LucideIcon> = {
  '/': Home,
  '/users': Users,
  '/groups': UserCircle,
  '/challenges': Trophy,
  '/rewards': Gift,
  '/notifications': Bell,
  '/schedules': Calendar,
  '/transactions': CreditCard,
  '/coins': Coins,
  '/activity': ClipboardList,
}

interface MobileNavProps {
  currentPath: string
}

/**
 * Mobile navigation component with hamburger menu.
 * Only visible on mobile viewports.
 */
export const MobileNav = memo(function MobileNav({
  currentPath,
}: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const firstNavItemRef = useRef<HTMLDivElement>(null)

  const navItems: NavItem[] = NAV_ITEMS.map((item) => ({
    ...item,
    icon: ICON_MAP[item.href] ?? Home,
  }))

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return currentPath === '/' || currentPath === ''
    }
    return currentPath.startsWith(href)
  }

  const navigateTo = useCallback((href: string) => {
    setOpen(false)
    window.location.href = href
  }, [])

  // Focus management: focus first nav item when sheet opens
  useEffect(() => {
    if (open && firstNavItemRef.current) {
      // Small delay to allow sheet animation to start
      const timer = setTimeout(() => {
        firstNavItemRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle escape key to close sheet
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <YStack
        display="flex"
        $gtSm={{ display: 'none' }}
        bottom={0}
        left={0}
        right={0}
        height={64}
        borderTopWidth={1}
        borderColor="$borderColor"
        backgroundColor="$backgroundHover"
        zIndex={100}
        role="navigation"
        aria-label="Mobile navigation"
        style={{ position: 'fixed' }}
      >
        <XStack
          flex={1}
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$4"
        >
          <Button
            variant="ghost"
            size="lg"
            leftIcon={<Menu size={24} />}
            onPress={() => setOpen(true)}
            accessibilityLabel="Open navigation menu"
          >
            <Text>Menu</Text>
          </Button>
        </XStack>
      </YStack>

      {/* Mobile Navigation Sheet */}
      <Sheet
        open={open}
        onOpenChange={setOpen}
        snapPoints={[85]}
        dismissOnSnapToBottom
        zIndex={200}
      >
        <Sheet.Frame padding="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <img
              src="/mirai_logo.png"
              alt="Mirai"
              style={{ height: 32, width: 'auto' }}
            />
            <Button
              variant="ghost"
              size="lg"
              leftIcon={<X size={24} />}
              onPress={() => setOpen(false)}
              accessibilityLabel="Close navigation menu"
            >
              <Text>Close</Text>
            </Button>
          </XStack>

          <YStack gap="$1" role="navigation" aria-label="Mobile menu items">
            {navItems.map((item, index) => {
              const active = isActive(item.href)
              const Icon = item.icon
              const isFirstItem = index === 0

              return (
                <XStack
                  key={item.href}
                  ref={isFirstItem ? firstNavItemRef : undefined}
                  alignItems="center"
                  gap="$3"
                  paddingHorizontal="$3"
                  paddingVertical="$3"
                  borderRadius="$3"
                  backgroundColor={active ? '$backgroundPress' : 'transparent'}
                  hoverStyle={
                    active
                      ? undefined
                      : {
                          backgroundColor: '$backgroundHover',
                        }
                  }
                  pressStyle={{
                    backgroundColor: '$backgroundPress',
                  }}
                  onPress={() => navigateTo(item.href)}
                  tabIndex={0}
                  role="link"
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <Icon
                    size={24}
                    color={active ? '$color' : '$colorMuted'}
                  />
                  <Text
                    fontSize="$4"
                    fontWeight={active ? '600' : '400'}
                    color={active ? '$color' : '$colorMuted'}
                  >
                    {item.label}
                  </Text>
                </XStack>
              )
            })}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
})
