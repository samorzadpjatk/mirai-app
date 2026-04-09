/// <reference lib="dom" />

import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "../ui/Modal";

describe("Modal", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders nothing when isOpen is false", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(container.innerHTML).toBe("");
  });

  test("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Modal content")).toBeDefined();
  });

  test("renders with title", () => {
    render(
      <Modal isOpen={true} title="Test Title" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByText("Test Title")).toBeDefined();
  });

  test("renders without title", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );

    // Should render successfully without title
    expect(screen.getByText("Modal content")).toBeDefined();
  });

  test("calls onClose when close button clicked", () => {
    let closeCalled = false;
    const onClose = () => {
      closeCalled = true;
    };

    render(
      <Modal isOpen={true} title="Test" onClose={onClose}>
        <p>Modal content</p>
      </Modal>,
    );

    // Find and click close button (IoClose icon)
    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(closeCalled).toBe(true);
  });

  test("has correct accessibility attributes", () => {
    render(
      <Modal isOpen={true} title="Accessible Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  test("renders children content", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div data-testid="child-content">Child element</div>
      </Modal>,
    );

    expect(screen.getByTestId("child-content")).toBeDefined();
  });

  test("renders complex children", () => {
    render(
      <Modal isOpen={true} title="Complex Modal" onClose={() => {}}>
        <form>
          <input type="text" placeholder="Enter name" />
          <button type="submit">Submit</button>
        </form>
      </Modal>,
    );

    expect(screen.getByPlaceholderText("Enter name")).toBeDefined();
    expect(screen.getByText("Submit")).toBeDefined();
  });
});
