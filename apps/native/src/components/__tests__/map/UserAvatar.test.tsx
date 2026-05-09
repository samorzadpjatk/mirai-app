import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { UserAvatar } from "../../map/ui/UserAvatar";

describe("UserAvatar", () => {
  it("should render image when imageUrl is provided", () => {
    renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={50}
      />
    );

    const image = screen.getByTestId("user-avatar-image");
    expect(image).toBeOnTheScreen();
  });

  it("should render initials when imageUrl is not provided", () => {
    renderWithProviders(
      <UserAvatar name="John Doe" size={50} />
    );

    expect(screen.getByText("JD")).toBeOnTheScreen();
  });

  it("should render initials when imageUrl is null", () => {
    renderWithProviders(
      <UserAvatar imageUrl={null} name="Jane Smith" size={50} />
    );

    expect(screen.getByText("JS")).toBeOnTheScreen();
  });

  it("should render initials when imageUrl is empty string", () => {
    renderWithProviders(
      <UserAvatar imageUrl="" name="Bob Johnson" size={50} />
    );

    expect(screen.getByText("BJ")).toBeOnTheScreen();
  });

  it("should render single initial for single name", () => {
    renderWithProviders(
      <UserAvatar name="Alice" size={50} />
    );

    expect(screen.getByText("A")).toBeOnTheScreen();
  });

  it("should render initials for multi-part name", () => {
    renderWithProviders(
      <UserAvatar name="Bob Smith Johnson" size={50} />
    );

    expect(screen.getByText("BJ")).toBeOnTheScreen();
  });

  it("should render question mark for empty name", () => {
    renderWithProviders(<UserAvatar name="" size={50} />);

    expect(screen.getByText("?")).toBeOnTheScreen();
  });

  it("should render question mark for whitespace-only name", () => {
    renderWithProviders(
      <UserAvatar name="   " size={50} />
    );

    expect(screen.getByText("?")).toBeOnTheScreen();
  });

  it("should apply correct size to image", () => {
    renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={60}
      />
    );

    const image = screen.getByTestId("user-avatar-image");
    expect(image).toHaveStyle({
      width: 60,
      height: 60,
      borderRadius: 30,
    });
  });

  it("should apply correct size to initials container", () => {
    renderWithProviders(
      <UserAvatar name="John Doe" size={60} />
    );

    const container = screen.getByTestId("user-avatar-initials-container");
    expect(container).toHaveStyle({
      width: 60,
      height: 60,
      borderRadius: 30,
    });
  });

  it("should render initials with correct font size", () => {
    renderWithProviders(
      <UserAvatar name="John Doe" size={50} />
    );

    const text = screen.getByTestId("user-avatar-initials-text");
    expect(text).toHaveStyle({
      fontSize: 20,
    });
  });

  it("should generate consistent background color for same name", () => {
    renderWithProviders(
      <>
        <UserAvatar name="John Doe" size={50} />
        <UserAvatar name="John Doe" size={50} />
      </>
    );

    const containers = screen.getAllByTestId("user-avatar-initials-container");
    const firstStyle = (containers[0] as unknown as { props: { style: { backgroundColor?: string }[] } }).props.style;
    const secondStyle = (containers[1] as unknown as { props: { style: { backgroundColor?: string }[] } }).props.style;
    const firstBg = firstStyle.find((s) => s.backgroundColor)?.backgroundColor;
    const secondBg = secondStyle.find((s) => s.backgroundColor)?.backgroundColor;
    expect(firstBg).toBe(secondBg);
  });

  it("should generate different background colors for different names", () => {
    renderWithProviders(
      <>
        <UserAvatar name="Alice" size={50} />
        <UserAvatar name="Bob" size={50} />
      </>
    );

    const containers = screen.getAllByTestId("user-avatar-initials-container");
    const firstStyle = (containers[0] as unknown as { props: { style: { backgroundColor?: string }[] } }).props.style;
    const secondStyle = (containers[1] as unknown as { props: { style: { backgroundColor?: string }[] } }).props.style;
    const firstBg = firstStyle.find((s) => s.backgroundColor)?.backgroundColor;
    const secondBg = secondStyle.find((s) => s.backgroundColor)?.backgroundColor;

    expect(firstBg).not.toBe(secondBg);
  });

  it("should use default size when size prop is not provided", () => {
    renderWithProviders(
      <UserAvatar name="John Doe" />
    );

    const container = screen.getByTestId("user-avatar-initials-container");
    expect(container).toHaveStyle({
      width: 38,
      height: 38,
      borderRadius: 19,
    });
  });

  it("should handle image error gracefully", () => {
    renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/invalid.jpg"
        name="John Doe"
        size={50}
      />
    );

    const image = screen.getByTestId("user-avatar-image");
    expect(image).toBeOnTheScreen();
  });
});
