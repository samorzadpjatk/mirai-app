import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { UserAvatar } from "../../map/ui/UserAvatar";

describe("UserAvatar", () => {
  it("should render image when imageUrl is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={50}
      />
    );

    const image = UNSAFE_getByType(Image);
    expect(image).toBeTruthy();
    expect(image.props.source.uri).toBe("https://example.com/avatar.jpg");
  });

  it("should render initials when imageUrl is not provided", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar name="John Doe" size={50} />
    );

    expect(getByText("JD")).toBeTruthy();
  });

  it("should render initials when imageUrl is null", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar imageUrl={null} name="Jane Smith" size={50} />
    );

    expect(getByText("JS")).toBeTruthy();
  });

  it("should render initials when imageUrl is empty string", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar imageUrl="" name="Bob Johnson" size={50} />
    );

    expect(getByText("BJ")).toBeTruthy();
  });

  it("should render single initial for single name", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar name="Alice" size={50} />
    );

    expect(getByText("A")).toBeTruthy();
  });

  it("should render initials for multi-part name", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar name="Bob Smith Johnson" size={50} />
    );

    expect(getByText("BJ")).toBeTruthy();
  });

  it("should render question mark for empty name", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar name="" size={50} />
    );

    expect(getByText("?")).toBeTruthy();
  });

  it("should render question mark for whitespace-only name", () => {
    const { getByText } = renderWithProviders(
      <UserAvatar name="   " size={50} />
    );

    expect(getByText("?")).toBeTruthy();
  });

  it("should apply correct size to image", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={60}
      />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 60, height: 60, borderRadius: 30 }),
      ])
    );
  });

  it("should apply correct size to initials container", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" size={60} />
    );

    const container = UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 60, height: 60, borderRadius: 30 }),
      ])
    );
  });

  it("should render initials with correct font size", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" size={50} />
    );

    const text = UNSAFE_getByType(Text);
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 20 })])
    );
  });

  it("should generate consistent background color for same name", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <>
        <UserAvatar name="John Doe" size={50} />
        <UserAvatar name="John Doe" size={50} />
      </>
    );

    const containers = UNSAFE_getAllByType(View);
    const firstBg = containers[0].props.style.find(
      (s: Record<string, string>) => s?.backgroundColor
    )?.backgroundColor;
    const secondBg = containers[1].props.style.find(
      (s: Record<string, string>) => s?.backgroundColor
    )?.backgroundColor;

    expect(firstBg).toBe(secondBg);
  });

  it("should generate different background colors for different names", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <>
        <UserAvatar name="Alice" size={50} />
        <UserAvatar name="Bob" size={50} />
      </>
    );

    const containers = UNSAFE_getAllByType(View);
    const firstBg = containers[0].props.style.find(
      (s: Record<string, string>) => s?.backgroundColor
    )?.backgroundColor;
    const secondBg = containers[1].props.style.find(
      (s: Record<string, string>) => s?.backgroundColor
    )?.backgroundColor;

    expect(firstBg).not.toBe(secondBg);
  });

  it("should use default size when size prop is not provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" />
    );

    const container = UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 38, height: 38, borderRadius: 19 }),
      ])
    );
  });

  it("should handle image error gracefully", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/invalid.jpg"
        name="John Doe"
        size={50}
      />
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.onError).toBeDefined();
  });
});
