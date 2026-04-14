/**
 * TestWrapper Component
 *
 * React test wrapper component that provides TamaguiProvider with
 * critical `disableInjectCSS` flag set for test environment.
 *
 * **IMPORTANT**: Always wrap component tests with TestWrapper to ensure
 * Tamagui theme tokens and context are available.
 *
 * @module test/TestWrapper
 *
 * @example
 * ```typescript
 * import { render } from '@testing-library/react';
 * import { TestWrapper } from '@mirai-app/ui/test';
 * import { Button } from '@mirai-app/ui';
 *
 * it('renders button', () => {
 *   const { container } = render(
 *     <TestWrapper>
 *       <Button>Test</Button>
 *     </TestWrapper>
 *   );
 *   expect(container.firstChild).toBeDefined();
 * });
 * ```
 */

import React, { type ReactNode } from "react";
import { TamaguiProvider } from "tamagui";
import { config } from "../tamagui.config";

/**
 * Props for TestWrapper component
 */
export interface TestWrapperProps {
  /** Child components to render within TamaguiProvider */
  children: ReactNode;
  /** Theme to use for testing (default: 'light') */
  theme?: "light" | "dark";
  /** Disable CSS injection - REQUIRED for test environment */
  disableInjectCSS?: boolean;
}

/**
 * Test wrapper component with TamaguiProvider.
 *
 * **CRITICAL**: `disableInjectCSS` is set to `true` by default to prevent
 * CSS injection issues in the Happy DOM test environment.
 *
 * @param props - TestWrapperProps
 * @returns React element wrapped with TamaguiProvider
 */
export function TestWrapper({
  children,
  theme = "light",
  disableInjectCSS = true,
}: TestWrapperProps): React.ReactElement {
  return (
    <TamaguiProvider
      config={config}
      defaultTheme={theme}
      disableInjectCSS={disableInjectCSS}
    >
      {children}
    </TamaguiProvider>
  );
}

/**
 * Alternative export for default import pattern
 */
export default TestWrapper;

/**
 * Factory function to create custom test wrappers with specific configuration
 *
 * @param defaultTheme - Default theme for the wrapper
 * @returns A TestWrapper component with preset theme
 *
 * @example
 * ```typescript
 * const DarkThemeWrapper = createTestWrapper('dark');
 *
 * it('renders in dark mode', () => {
 *   const { container } = render(
 *     <DarkThemeWrapper>
 *       <Card>Content</Card>
 *     </DarkThemeWrapper>
 *   );
 *   expect(container.firstChild).toBeDefined();
 * });
 * ```
 */
export function createTestWrapper(
  defaultTheme: "light" | "dark" = "light",
): React.FC<Omit<TestWrapperProps, "theme">> {
  return function PresetTestWrapper({ children, disableInjectCSS = true }) {
    return (
      <TamaguiProvider
        config={config}
        defaultTheme={defaultTheme}
        disableInjectCSS={disableInjectCSS}
      >
        {children}
      </TamaguiProvider>
    );
  };
}

/**
 * Pre-configured dark theme test wrapper
 *
 * @example
 * ```typescript
 * import { render } from '@testing-library/react';
 * import { TestWrapperDark, Button } from '@mirai-app/ui/test';
 *
 * it('renders in dark mode', () => {
 *   const { container } = render(
 *     <TestWrapperDark>
 *       <Button>Dark</Button>
 *     </TestWrapperDark>
 *   );
 *   expect(container.firstChild).toBeDefined();
 * });
 * ```
 */
export const TestWrapperDark: React.FC<
  Omit<TestWrapperProps, "theme" | "disableInjectCSS">
> = ({ children }) => (
  <TamaguiProvider config={config} defaultTheme="dark" disableInjectCSS>
    {children}
  </TamaguiProvider>
);
