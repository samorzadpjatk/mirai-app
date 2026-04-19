'use client'

import { memo, useCallback } from 'react'
import { YStack, XStack, Text, Button } from '@mirai-app/ui'
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

interface SidebarProps {
  currentPath: string
}

/**
 * Sidebar navigation component for desktop.
 * Displays vertical navigation links with active state highlighting.
 */
export const Sidebar = memo(function Sidebar({ currentPath }: SidebarProps) {
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
    window.location.href = href
  }, [])

  return (
    <YStack 
      padding="$4" 
      gap="$1"
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon

        return (
          <Button
            key={item.href}
            onPress={() => navigateTo(item.href)}
            variant="ghost"
            size="lg"
            fullWidth
            accessibilityLabel={item.label}
          >
            <XStack 
              alignItems="center" 
              gap="$3" 
              width="100%"
              aria-current={active ? 'page' : undefined}
              role="link"
            >
              <Icon size={20} color={active ? '$color' : '$colorMuted'} />
              <Text
                fontSize="$3"
                fontWeight={active ? '600' : '400'}
                color={active ? '$color' : '$colorMuted'}
              >
                {item.label}
              </Text>
            </XStack>
          </Button>
        )
      })}
    </YStack>
  )
})
