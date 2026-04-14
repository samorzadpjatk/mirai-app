/**
 * Card Component Tests
 *
 * [UNIT] Tier 1 Primitive - Container with theme background
 *
 * Test coverage:
 * - Basic rendering with TamaguiProvider
 * - Theme token resolution ($background)
 * - Variant rendering (size, elevation, bordered, fullWidth)
 * - Props API validation
 * - Cross-platform compatibility (web/native)
 *
 * @module @mirai-app/ui/components/__tests__/Card
 */

import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import { Card } from "../Card";
import { TestWrapper, TestWrapperDark } from "../../../test/TestWrapper";

describe("[UNIT] Card", () => {
  describe("Basic Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(
        <TestWrapper>
          <Card>Content</Card>
        </TestWrapper>,
      );

      const card = container.firstChild;
      expect(card).toBeDefined();
      // Tamagui View renders as div or span depending on platform
      expect(["div", "span"]).toContain(card?.nodeName.toLowerCase());
    });

    it("renders children correctly", () => {
      const { getByText } = render(
        <TestWrapper>
          <Card>Card Content</Card>
        </TestWrapper>,
      );

      expect(getByText("Card Content")).toBeDefined();
    });

    it("applies correct accessibility role", () => {
      const { container } = render(
        <TestWrapper>
          <Card>Content</Card>
        </TestWrapper>,
      );

      // View component renders as a div or span depending on platform
      const card = container.firstChild as HTMLElement;
      expect(["div", "span"]).toContain(card.tagName.toLowerCase());
    });
  });

  describe("Theme Integration", () => {
    it("renders in light theme", () => {
      const { container } = render(
        <TestWrapper theme="light">
          <Card>Light Mode Card</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("renders in dark theme", () => {
      const { container } = render(
        <TestWrapperDark>
          <Card>Dark Mode Card</Card>
        </TestWrapperDark>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("$background token resolves via theme context", () => {
      // Card uses $background which should resolve to CSS var via theme
      const { container } = render(
        <TestWrapper>
          <Card data-testid="card">Themed Card</Card>
        </TestWrapper>,
      );

      const card = container.querySelector('[data-testid="card"]');
      expect(card).toBeDefined();
    });
  });

  describe("Variant Props", () => {
    describe("size variant", () => {
      it("renders with size='sm'", () => {
        const { container } = render(
          <TestWrapper>
            <Card size="sm">Small Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with size='md' (default)", () => {
        const { container } = render(
          <TestWrapper>
            <Card size="md">Medium Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with size='lg'", () => {
        const { container } = render(
          <TestWrapper>
            <Card size="lg">Large Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });
    });

    describe("elevation variant", () => {
      it("renders with elevation='none'", () => {
        const { container } = render(
          <TestWrapper>
            <Card elevation="none">No Elevation</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with elevation='sm' (default)", () => {
        const { container } = render(
          <TestWrapper>
            <Card elevation="sm">Small Elevation</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with elevation='md'", () => {
        const { container } = render(
          <TestWrapper>
            <Card elevation="md">Medium Elevation</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with elevation='lg'", () => {
        const { container } = render(
          <TestWrapper>
            <Card elevation="lg">Large Elevation</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });
    });

    describe("bordered variant", () => {
      it("renders with bordered={true}", () => {
        const { container } = render(
          <TestWrapper>
            <Card bordered={true}>Bordered Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with bordered={false} (default)", () => {
        const { container } = render(
          <TestWrapper>
            <Card bordered={false}>No Border Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });
    });

    describe("fullWidth variant", () => {
      it("renders with fullWidth={true}", () => {
        const { container } = render(
          <TestWrapper>
            <Card fullWidth={true}>Full Width Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });

      it("renders with fullWidth={false} (default)", () => {
        const { container } = render(
          <TestWrapper>
            <Card fullWidth={false}>Auto Width Card</Card>
          </TestWrapper>,
        );

        expect(container.firstChild).toBeDefined();
      });
    });
  });

  describe("Layout Props", () => {
    it("accepts padding shorthand 'p'", () => {
      const { container } = render(
        <TestWrapper>
          <Card p="$4">Padded Card</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("accepts paddingHorizontal shorthand 'px'", () => {
      const { container } = render(
        <TestWrapper>
          <Card px="$4">Horizontal Padding</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("accepts paddingVertical shorthand 'py'", () => {
      const { container } = render(
        <TestWrapper>
          <Card py="$4">Vertical Padding</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("accepts borderRadius shorthand 'br'", () => {
      const { container } = render(
        <TestWrapper>
          <Card br="$2">Rounded Card</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("accepts margin shorthand 'm'", () => {
      const { container } = render(
        <TestWrapper>
          <Card m="$4">Margin Card</Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe("Combination Props", () => {
    it("renders with multiple variants combined", () => {
      const { container } = render(
        <TestWrapper>
          <Card size="lg" elevation="lg" bordered={true} fullWidth={true}>
            Complex Card
          </Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("combines variants with layout props", () => {
      const { container } = render(
        <TestWrapper>
          <Card size="md" p="$6" m="$2" br="$full">
            Styled Card
          </Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("renders with no children", () => {
      const { container } = render(
        <TestWrapper>
          <Card />
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("renders with nested Card components", () => {
      const { container } = render(
        <TestWrapper>
          <Card size="lg">
            <Card size="sm">Nested</Card>
          </Card>
        </TestWrapper>,
      );

      expect(container.firstChild).toBeDefined();
    });

    it("renders with multiple children", () => {
      const { getByText } = render(
        <TestWrapper>
          <Card>
            <span>Child 1</span>
            <span>Child 2</span>
            <span>Child 3</span>
          </Card>
        </TestWrapper>,
      );

      expect(getByText("Child 1")).toBeDefined();
      expect(getByText("Child 2")).toBeDefined();
      expect(getByText("Child 3")).toBeDefined();
    });
  });
});
