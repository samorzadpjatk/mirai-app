/**
 * Sheet Component - Cross-Platform Modal/Sheet Primitive
 *
 * A unified modal/sheet component that provides:
 * - **Web**: Modal dialog with overlay (centered, max-width constrained)
 * - **Native**: Bottom sheet that slides up from the bottom
 *
 * This component replaces the legacy Modal component and AppModalShell from native.
 * It leverages Tamagui's Sheet component which handles platform differences internally.
 *
 * @module components/Sheet
 * @see https://tamagui.dev/ui/sheet
 *
 * @example
 * ```tsx
 * import { Sheet } from '@mirai-app/ui';
 *
 * function MyScreen() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onPress={() => setOpen(true)}>Open Sheet</Button>
 *       <Sheet
 *         open={open}
 *         onOpenChange={setOpen}
 *         title="Sheet Title"
 *       >
 *         <Text>Sheet content goes here</Text>
 *       </Sheet>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Without title (no header)
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <Text>Content without header</Text>
 * </Sheet>
 * ```
 *
 * @example
 * ```tsx
 * // With custom snap points
 * <Sheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Custom Sheet"
 *   snapPoints={[50, 85]}
 * >
 *   <Text>Content with custom snap points</Text>
 * </Sheet>
 * ```
 */

import type { ReactNode } from "react";
import { Sheet as TamaguiSheet, YStack, XStack, Button } from "tamagui";
import { Text } from "./Text";

/**
 * Sheet component props interface
 *
 * All props are fully typed with JSDoc documentation for IDE support.
 */
export interface SheetProps {
  /** Controls whether the sheet is visible or hidden */
  open: boolean;

  /** Callback when the open state should change (close via backdrop, dismiss gesture, etc.) */
  onOpenChange: (open: boolean) => void;

  /** Content to render inside the sheet */
  children: ReactNode;

  /** Optional title displayed in the sheet header */
  title?: string;

  /**
   * Snap points for the sheet height (native only).
   * Each value is a percentage of screen height (0-100).
   * @default [85] - Sheet takes up 85% of screen on mobile
   */
  snapPoints?: number[];

  /**
   * Sheet positioning variant.
   * - "modal": Centered modal with overlay (web default)
   * - "bottom": Bottom sheet that slides up (native default)
   * @default "bottom" on native, "modal" on web
   */
  position?: "modal" | "bottom";

  /**
   * Whether to show the overlay/background dim.
   * @default true
   */
  overlay?: boolean;

  /**
   * Maximum width of the sheet content (for modal variant).
   * Accepts theme tokens like "$size.maxW" or pixel values.
   * @default 480
   */
  maxWidth?: number;

  /**
   * Additional padding for sheet content.
   * @default 16 (represented as "$4")
   */
  contentPadding?: number;

  /**
   * Whether the sheet can be dismissed by clicking/tapping the overlay.
   * @default true
   */
  dismissOnOverlayPress?: boolean;

  /**
   * Whether the sheet can be dismissed by swiping down (native only).
   * @default true
   */
  dismissOnSnapToBottom?: boolean;

  /**
   * Test ID for testing purposes.
   */
  testID?: string;
}

/**
 * Close icon component (X) - SVG-based to avoid icon dependency issues
 */
function CloseIcon({
  size = 20,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Cross-platform Sheet component that renders as:
 * - **Web**: A modal dialog with overlay, centered with max-width
 * - **Native**: A bottom sheet that slides up with snap points
 *
 * Uses Tamagui's Sheet internally which handles platform differences.
 * The component adapts its behavior based on the platform automatically.
 *
 * @param props - SheetProps
 * @returns React element
 */
export function Sheet({
  open,
  onOpenChange,
  children,
  title,
  snapPoints = [85],
  position = "bottom",
  overlay = true,
  maxWidth = 480,
  contentPadding = 16,
  dismissOnOverlayPress = true,
  dismissOnSnapToBottom = true,
  testID,
}: SheetProps): React.ReactElement | null {
  // Handle close action
  const handleClose = () => {
    onOpenChange(false);
  };

  // Determine if we should show the header
  const showHeader = Boolean(title);

  // Map position string to snap point index
  // "modal" = centered, "bottom" = from bottom
  const positionIndex = position === "modal" ? 0 : 1;

  return (
    <TamaguiSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      position={positionIndex}
      dismissOnOverlayPress={dismissOnOverlayPress}
      dismissOnSnapToBottom={dismissOnSnapToBottom}
      forceRemoveScrollEnabled={open}
      modal={position === "modal"}
      data-testid={testID}
    >
      {/* Overlay - shows dimmed background when sheet is open */}
      {overlay && (
        <TamaguiSheet.Overlay
          animation="fast"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          opacity={0.6}
          backgroundColor="$backgroundDark"
        />
      )}

      {/* Sheet Frame - the main container */}
      <TamaguiSheet.Frame
        backgroundColor="$card"
        borderTopLeftRadius={position === "bottom" ? 16 : 16}
        borderTopRightRadius={position === "bottom" ? 16 : 16}
        borderBottomLeftRadius={position === "modal" ? 16 : 0}
        borderBottomRightRadius={position === "modal" ? 16 : 0}
        borderWidth={1}
        borderColor="$borderColor"
        maxWidth={position === "modal" ? maxWidth : undefined}
        width="100%"
        alignSelf="center"
        {...(position === "modal" && {
          margin: 16,
          justifyContent: "center",
          alignItems: "stretch",
        })}
      >
        {/* Handle indicator for bottom sheet (native visual cue) */}
        {position === "bottom" && (
          <YStack alignItems="center" paddingTop={8} paddingBottom={4}>
            <YStack
              width={40}
              height={4}
              backgroundColor="$borderColor"
              borderRadius={9999}
            />
          </YStack>
        )}

        {/* Header with title and close button */}
        {showHeader && (
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal={contentPadding}
            paddingTop={position === "bottom" ? 8 : contentPadding}
            paddingBottom={12}
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text variant="h3" color="$color">
              {title}
            </Text>
            <Button
              size="$2"
              chromeless
              circular
              onPress={handleClose}
              accessibilityLabel="Close sheet"
              icon={<CloseIcon size={20} />}
            />
          </XStack>
        )}

        {/* Close button for modal without title */}
        {position === "modal" && !showHeader && (
          <XStack
            justifyContent="flex-end"
            padding={contentPadding}
            paddingBottom={0}
          >
            <Button
              size="$2"
              chromeless
              circular
              onPress={handleClose}
              accessibilityLabel="Close sheet"
              icon={<CloseIcon size={20} />}
            />
          </XStack>
        )}

        {/* Sheet Content */}
        <YStack padding={contentPadding} flex={1}>
          {children}
        </YStack>
      </TamaguiSheet.Frame>
    </TamaguiSheet>
  );
}

/**
 * Sheet sub-components for advanced composition.
 *
 * Use these when you need more control over the sheet structure.
 *
 * @example
 * ```tsx
 * <Sheet open={open} onOpenChange={setOpen}>
 *   <Sheet.Overlay />
 *   <Sheet.Frame>
 *     <Sheet.Handle />
 *     <Text>Custom content</Text>
 *   </Sheet.Frame>
 * </Sheet>
 * ```
 */

// Attach sub-components to main export
Sheet.Overlay = TamaguiSheet.Overlay;
Sheet.Frame = TamaguiSheet.Frame;
Sheet.Handle = TamaguiSheet.Handle;
Sheet.ScrollView = TamaguiSheet.ScrollView;

export default Sheet;
