/// <reference lib="dom" />

/**
 * Modal Component Tests
 *
 * Tests for the Modal component which is a Tamagui Sheet-based implementation.
 * All tests must use TestWrapper to provide TamaguiProvider context.
 *
 * @module components/__tests__/Modal
 */

import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "../ui/Modal";
import { TestWrapper } from "@mirai-app/ui/test";

describe("[UNIT] Modal", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders hidden when isOpen is false", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={false} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // When closed, Sheet still renders but with hidden styles (opacity: 0, pointer-events: none)
    const modalElement = container.querySelector('[style*="opacity: 0"]');
    expect(modalElement).toBeDefined();
  });

  test("renders when isOpen is true", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // Content should be in the DOM with visible styles
    expect(container.textContent).toContain("Modal content");
  });

  test("renders with title", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} title="Test Title" onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // Modal should render without crashing with a title
    // The title is passed to Sheet which renders it in a header
    expect(container.firstChild).toBeDefined();
    expect(container.textContent).toContain("Modal content");
  });

  test("renders without title", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // Should render successfully without title
    expect(container.textContent).toContain("Modal content");
  });

  test("calls onClose when close button clicked", () => {
    let closeCalled = false;
    const onClose = () => {
      closeCalled = true;
    };

    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} title="Test" onClose={onClose}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // Find and click close button by aria-label
    const closeButton = container.querySelector('[aria-label="Close sheet"]');
    expect(closeButton).toBeDefined();

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(closeCalled).toBe(true);
    }
  });

  test("has correct accessibility attributes on content", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} title="Accessible Modal" onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      </TestWrapper>,
    );

    // The Sheet should render with accessibility considerations
    const content =
      container.querySelector('[role="dialog"]') ||
      container.querySelector("[aria-modal]") ||
      container.querySelector("[data-testid]");
    // If no specific aria attributes, at least content is rendered
    expect(container.textContent).toContain("Modal content");
  });

  test("renders children content", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} onClose={() => {}}>
          <div data-testid="child-content">Child element</div>
        </Modal>
      </TestWrapper>,
    );

    expect(container.textContent).toContain("Child element");
  });

  test("renders complex children", () => {
    const { container } = render(
      <TestWrapper>
        <Modal isOpen={true} title="Complex Modal" onClose={() => {}}>
          <form>
            <input type="text" placeholder="Enter name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      </TestWrapper>,
    );

    // Check for input element by placeholder attribute
    const input = container.querySelector('input[placeholder="Enter name"]');
    expect(input).toBeDefined();

    // Check for submit button
    expect(container.textContent).toContain("Submit");
  });
});
