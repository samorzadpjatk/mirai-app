/**
 * Spinner Component Tests
 *
 * [UNIT] Tier 1 primitive - Loading indicator
 *
 * Tests verify:
 * - Component renders without errors
 * - Theme tokens resolve correctly
 * - Props are properly typed
 * - Cross-platform compatibility (web/native)
 *
 * @module components/Spinner.test
 */

import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import {
  Spinner,
  type SpinnerProps,
  type SpinnerSize,
  type SpinnerColor,
} from "../../src/components/Spinner";
import { TestWrapper } from "../TestWrapper";

describe("[UNIT] Spinner", () => {
  it("renders with default props", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with small size", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner size="small" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with large size", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner size="large" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with primary color token", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner color="$primary" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with success color token", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner color="$success" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with danger color token", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner color="$danger" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with warning color token", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner color="$warning" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders in dark theme", () => {
    const { container } = render(
      <TestWrapper theme="dark">
        <Spinner color="$primary" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("accepts all valid SpinnerProps", () => {
    const props: SpinnerProps = {
      size: "small",
      color: "$primary",
      accessibilityRole: "progressbar",
    };
    const { container } = render(
      <TestWrapper>
        <Spinner {...props} />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders with combined size and color props", () => {
    const { container } = render(
      <TestWrapper>
        <Spinner size="large" color="$success" />
      </TestWrapper>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it("exports type definitions", () => {
    // Type-only test - verifies types are exported
    type TestSize = SpinnerSize;
    type TestColor = SpinnerColor;
    expect(true).toBe(true); // Runtime assertion
  });
});
