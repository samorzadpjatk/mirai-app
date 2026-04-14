/// <reference lib="dom" />

import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Select } from "../ui/Select";

describe("[UNIT] Select", () => {
  afterEach(() => {
    cleanup();
  });
  const defaultOptions = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  test("renders select with options", () => {
    render(<Select options={defaultOptions} />);

    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByText("Option 2")).toBeDefined();
    expect(screen.getByText("Option 3")).toBeDefined();
  });

  test("renders with label", () => {
    render(<Select label="Choose an option" options={defaultOptions} />);

    expect(screen.getByText("Choose an option")).toBeDefined();
  });

  test("renders without label", () => {
    const { container } = render(<Select options={defaultOptions} />);

    // Should not have label element
    expect(container.querySelector("label")).toBeNull();
  });

  test("renders with placeholder", () => {
    render(
      <Select options={defaultOptions} placeholder="Select an option..." />,
    );

    expect(screen.getByText("Select an option...")).toBeDefined();
  });

  test("renders with error message", () => {
    render(
      <Select
        label="Test Label"
        options={defaultOptions}
        error="This field is required"
      />,
    );

    expect(screen.getByText("This field is required")).toBeDefined();
  });

  test("calls onChange when selection changes", () => {
    let selectedValue = "";
    const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      selectedValue = event.target.value;
    };

    render(<Select options={defaultOptions} onChange={onChange} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "option2" } });

    expect(selectedValue).toBe("option2");
  });

  test("select has correct id when provided", () => {
    render(<Select id="custom-select" label="Test" options={defaultOptions} />);

    const select = screen.getByRole("combobox");
    expect(select.id).toBe("custom-select");
  });

  test("select uses name as id when id not provided", () => {
    render(
      <Select name="test-select-name" label="Test" options={defaultOptions} />,
    );

    const select = screen.getByRole("combobox");
    expect(select.id).toBe("test-select-name");
  });

  test("label htmlFor matches select id", () => {
    render(<Select id="test-id" label="Test Label" options={defaultOptions} />);

    const label = screen.getByText("Test Label");
    const select = screen.getByRole("combobox");

    expect(label.getAttribute("for")).toBe(select.id);
  });

  test("applies custom className", () => {
    const { container } = render(
      <Select options={defaultOptions} className="custom-select-class" />,
    );

    const select = container.querySelector("select");
    expect(select?.classList.contains("custom-select-class")).toBe(true);
  });

  test("can be disabled", () => {
    render(<Select options={defaultOptions} disabled />);

    const select = screen.getByRole("combobox");
    expect(select.disabled).toBe(true);
  });

  test("renders with empty options array", () => {
    render(<Select options={[]} placeholder="No options available" />);

    expect(screen.getByText("No options available")).toBeDefined();
  });

  test("applies error styling when error prop provided", () => {
    render(<Select options={defaultOptions} error="Error message" />);

    const select = screen.getByRole("combobox");
    // Error styling should include "border-danger" class
    expect(select.className.includes("border-danger")).toBe(true);
  });
});
