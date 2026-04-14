/**
 * Storybook Preview Configuration
 *
 * Configures the preview environment with TamaguiProvider for consistent
 * theme and styling across all component stories.
 *
 * @see https://storybook.js.org/docs/configure/story-rendering
 */

import React from "react";
import type { Preview } from "@storybook/react";
import { TamaguiProvider } from "tamagui";
import { config } from "../tamagui.config";

/**
 * Global preview configuration
 */
const preview: Preview = {
  /**
   * Global decorators applied to all stories
   */
  decorators: [
    /**
     * TamaguiProvider wrapper decorator
     *
     * Wraps all stories with TamaguiProvider to ensure:
     * - Theme tokens are available
     * - Consistent styling across stories
     * - Light/dark theme switching support
     *
     * @param Story - The story component to render
     * @param context - Story context with theme and other parameters
     * @returns Wrapped story component
     */
    (Story, context) => {
      // Get theme from story context or default to light
      const theme = context.globals.theme || "light";

      return (
        <TamaguiProvider
          config={config}
          defaultTheme={theme}
          // Enable CSS injection for Storybook (unlike tests)
          disableInjectCSS={false}
        >
          <div
            style={{
              padding: "20px",
              minHeight: "100vh",
              backgroundColor: theme === "dark" ? "#000" : "#fff",
            }}
          >
            <Story />
          </div>
        </TamaguiProvider>
      );
    },
  ],

  /**
   * Global parameters
   */
  parameters: {
    /**
     * Actions configuration
     */
    actions: {
      argTypesRegex: "^on[A-Z].*",
    },

    /**
     * Controls configuration
     */
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true, // Show all controls by default
    },

    /**
     * Background options for theme switching
     */
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#000000",
        },
        {
          name: "gray",
          value: "#f5f5f5",
        },
      ],
    },

    /**
     * Viewport configuration
     */
    viewport: {
      viewports: {
        // Mobile viewports
        mobile1: {
          name: "Mobile Small",
          styles: {
            width: "320px",
            height: "568px",
          },
        },
        mobile2: {
          name: "Mobile Large",
          styles: {
            width: "414px",
            height: "896px",
          },
        },
        // Tablet viewports
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        // Desktop viewports
        desktop: {
          name: "Desktop",
          styles: {
            width: "1024px",
            height: "768px",
          },
        },
        wide: {
          name: "Wide Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
      },
    },

    /**
     * Layout configuration
     */
    layout: "padded",

    /**
     * Docs configuration
     */
    docs: {
      story: {
        inline: true,
      },
    },

    /**
     * Options panel configuration
     */
    options: {
      storySort: {
        order: [
          // Introduction docs
          "Introduction",
          // Theme docs
          "Theme",
          // Components by category
          "Components",
          [
            "Primitives",
            "Button",
            "Card",
            "Input",
            "Select",
            "Sheet",
            "Spinner",
            "Text",
          ],
          // Styled components
          "Styled",
          // Hooks
          "Hooks",
        ],
      },
    },
  },

  /**
   * Global types for toolbar items
   */
  globalTypes: {
    /**
     * Theme toggle in toolbar
     */
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },

  /**
   * Initial globals
   */
  initialGlobals: {
    theme: "light",
    background: {
      value: "light",
    },
  },
};

export default preview;
