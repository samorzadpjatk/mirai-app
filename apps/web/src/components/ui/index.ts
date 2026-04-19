/**
 * UI Components - Web UI Primitive Library
 *
 * Re-exports all UI primitives from @mirai-app/ui with web-specific defaults.
 * This module provides a consistent component API for admin pages.
 *
 * @module @/components/ui
 */

// Button - Button primitive with variants: primary, secondary, ghost, danger
export {
  Button,
  StyledButtonFrame,
  StyledButtonText,
  type ButtonProps,
  type StyledButtonFrameProps,
  type StyledButtonTextProps,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";

// Card - Container primitive with theme background
export { Card, type CardProps } from "./Card";

// Input - Form input with label/error support
export {
  Input,
  InputLabel,
  InputHelper,
  InputError,
  type InputProps,
  type InputSize,
  type InputVariant,
} from "./Input";

// Select - Cross-platform dropdown/select primitive
export {
  Select,
  type SelectProps,
  type SelectItemProps,
  type SelectGroupProps,
  type SelectLabelProps,
} from "./Select";

// Sheet - Cross-platform modal/sheet primitive
export { Sheet, type SheetProps } from "./Sheet";

// Text - Typography primitive with semantic variants
export {
  Text,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  Caption,
  LabelText,
  type TextProps,
  SizableText,
  Paragraph,
  Heading,
} from "./Text";

// LoadingSpinner - Loading indicator with optional label
export { LoadingSpinner, type LoadingSpinnerProps } from "./LoadingSpinner";

// ErrorMessage - Error state display component
export { ErrorMessage, type ErrorMessageProps } from "./ErrorMessage";

// Icon - Lucide icon wrapper with consistent sizing
export {
  Icon,
  Icons,
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Check,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Upload,
  Image,
  FileText,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  type IconName,
  type IconProps,
  type LucideProps,
} from "./Icon";

// Layout primitives
export {
  YStack,
  XStack,
  Stack,
  ZStack,
} from "@mirai-app/ui";
