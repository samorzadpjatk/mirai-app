/// <reference lib="dom" />

import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { OTPCodeInput } from "../OTPCodeInput";

describe("[UNIT] OTPCodeInput", () => {
  // Clean up after each test
  afterEach(() => {
    cleanup();
  });

  test("renders input element", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  test("displays current value", () => {
    render(<OTPCodeInput value="123456" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
    expect(lastInput.value).toBe("123456");
  });

  test("calls onChange with filtered value (numbers only)", () => {
    let changedValue = "";
    const onChange = (value: string) => {
      changedValue = value;
    };

    render(<OTPCodeInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];

    fireEvent.change(input, { target: { value: "abc123" } });
    expect(changedValue).toBe("123");
  });

  test("limits input to 6 characters", () => {
    let changedValue = "";
    const onChange = (value: string) => {
      changedValue = value;
    };

    render(<OTPCodeInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];

    fireEvent.change(input, { target: { value: "1234567890" } });
    expect(changedValue).toBe("123456");
  });

  test("strips non-numeric characters", () => {
    let changedValue = "";
    const onChange = (value: string) => {
      changedValue = value;
    };

    render(<OTPCodeInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];

    fireEvent.change(input, { target: { value: "1a2b3c4d5e6f" } });
    expect(changedValue).toBe("123456");
  });

  test("can be disabled", () => {
    render(<OTPCodeInput value="" onChange={() => {}} disabled />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.disabled).toBe(true);
  });

  test("has numeric input mode", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.getAttribute("inputmode")).toBe("numeric");
  });

  test("has one-time-code autocomplete", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.getAttribute("autocomplete")).toBe("one-time-code");
  });

  test("has correct pattern attribute", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.getAttribute("pattern")).toBe("[0-9]{6}");
  });

  test("has maxLength of 6", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.getAttribute("maxlength")).toBe("6");
  });

  test("shows placeholder", () => {
    render(<OTPCodeInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    const lastInput = inputs[inputs.length - 1];
    expect(lastInput.getAttribute("placeholder")).toBe("123456");
  });
});
