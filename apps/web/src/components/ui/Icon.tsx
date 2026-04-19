'use client'

import { memo } from 'react'
import type { LucideProps } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

// Type for valid icon names - exclude non-component exports
export type IconName = keyof typeof LucideIcons

// Type for icon component from lucide-react
export type LucideIconComponent = React.ForwardRefExoticComponent<LucideProps>

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName
}

/**
 * Type guard to check if a value is a valid React component
 */
function isValidComponent(
  value: unknown
): value is React.ForwardRefExoticComponent<LucideProps> {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && 'render' in value)
  )
}

/**
 * Icon component that wraps lucide-react icons
 * Provides consistent sizing and styling
 */
export const Icon = memo(function Icon({ name, size = 20, ...props }: IconProps) {
  const IconComponent = LucideIcons[name]

  if (!IconComponent || !isValidComponent(IconComponent)) {
    console.warn(`Icon "${name}" not found in lucide-react`)
    return null
  }

  return <IconComponent size={size} {...props} />
})

// Re-export common icons for direct usage
export {
  Home,
  Users,
  UserCircle,
  User,
  Trophy,
  Gift,
  Bell,
  Calendar,
  CreditCard,
  Coins,
  ClipboardList,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  LogOut,
  LogIn,
  Settings,
  Plus,
  Minus,
  Edit,
  Edit2,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Check,
  CheckCircle,
  Play,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Upload,
  Image,
  Camera,
  Package,
  FileText,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  History,
  ThumbsUp,
  Star,
  Bus,
  Bed,
  Utensils,
  HelpCircle,
  type LucideProps,
} from 'lucide-react'

// Aliases for commonly used icons
export { ThumbsUp as Vote } from 'lucide-react'

// Export all icons as a namespace for dynamic usage
export * as Icons from 'lucide-react'
