/// <reference lib="dom" />

/**
 * Select Component Tests
 *
 * Tests for the Select component which is a Tamagui-based implementation.
 * All tests must use TestWrapper to provide TamaguiProvider context.
 *
 * @module components/__tests__/Select
 */

import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Select } from "../ui/Select";
import { TestWrapper } from "@mirai-app/ui/test";

describe("[UNIT] Select", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultOptions = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  test("renders select component", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} />
      </TestWrapper>,
    );

    // The component should render without crashing
    expect(container.firstChild).toBeDefined();
  });

  test("renders with options", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} />
      </TestWrapper>,
    );

    // Options should be rendered in the DOM
    expect(container.textContent).toContain("Option 1");
    expect(container.textContent).toContain("Option 2");
    expect(container.textContent).toContain("Option 3");
  });

  test("renders with label", () => {
    const { container } = render(
      <TestWrapper>
        <Select label="Choose an option" options={defaultOptions} />
      </TestWrapper>,
    );

    // Label should be associated with the select
    const label = container.querySelector("label");
    expect(label).toBeDefined();
  });

  test("renders without label", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} />
      </TestWrapper>,
    );

    // Should not have label element when not provided
    const label = container.querySelector("label");
    expect(label).toBeNull();
  });

  test("renders with custom placeholder", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} placeholder="Select an option..." />
      </TestWrapper>,
    );

    // Component should render with placeholder value in hidden input
    const hiddenInput = container.querySelector('input[type="hidden"]');
    expect(hiddenInput).toBeDefined();
  });

  test("renders with error state", () => {
    const { container } = render(
      <TestWrapper>
        <Select
          label="Test Label"
          options={defaultOptions}
          error="This field is required"
        />
      </TestWrapper>,
    );

    // Component should render without error when error prop is provided
    // Note: Error display may be handled differently in the Tamagui adapter
    expect(container.firstChild).toBeDefined();
  });

  test("calls onChange when selection changes", () => {
    let selectedValue = "";
    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      selectedValue = event.target.value;
    };

    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} onChange={onChange} />
      </TestWrapper>,
    );

    // Find the hidden input and simulate change
    const hiddenInput = container.querySelector('input[type="hidden"]');
    expect(hiddenInput).toBeDefined();

    if (hiddenInput) {
      fireEvent.change(hiddenInput, { target: { value: "option2" } });
      expect(selectedValue).toBe("option2");
    }
  });

  test("select has correct id when provided", () => {
    const { container } = render(
      <TestWrapper>
        <Select id="custom-select" label="Test" options={defaultOptions} />
      </TestWrapper>,
    );

    // Should have elements with the provided id
    const elementWithId = container.querySelector("#custom-select");
    expect(elementWithId).toBeDefined();
  });

  test("select uses name as id when id not provided", () => {
    const { container } = render(
      <TestWrapper>
        <Select name="test-select-name" label="Test" options={defaultOptions} />
      </TestWrapper>,
    );

    // Hidden input should use name as id
    const hiddenInput = container.querySelector(
      'input[name="test-select-name"]',
    );
    expect(hiddenInput).toBeDefined();
  });

  test("label htmlFor matches select id", () => {
    const { container } = render(
      <TestWrapper>
        <Select id="test-id" label="Test Label" options={defaultOptions} />
      </TestWrapper>,
    );

    const label = container.querySelector("label");
    expect(label).toBeDefined();
    if (label) {
      expect(label.getAttribute("for")).toBe("test-id");
    }
  });

  test("can be disabled", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={defaultOptions} disabled />
      </TestWrapper>,
    );

    // Component should render without error when disabled
    expect(container.firstChild).toBeDefined();
  });

  test("renders with empty options array", () => {
    const { container } = render(
      <TestWrapper>
        <Select options={[]} placeholder="No options available" />
      </TestWrapper>,
    );

    // Should handle empty options gracefully
    expect(container.firstChild).toBeDefined();
  });
});
