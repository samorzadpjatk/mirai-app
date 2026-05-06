import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { UserAvatar } from "../../map/ui/UserAvatar";

interface AvatarStyle {
  width?: number;
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  fontSize?: number;
}

interface AvatarTestInstance {
  props: {
    source?: { uri?: string };
    onError?: (() => void) | undefined;
    style?: AvatarStyle | readonly AvatarStyle[];
  };
}

function asAvatarTestInstance(instance: unknown): AvatarTestInstance {
  return instance as AvatarTestInstance;
}

function asAvatarTestInstances(instances: unknown): AvatarTestInstance[] {
  return instances as AvatarTestInstance[];
}

function getStyles(
  style: AvatarStyle | readonly AvatarStyle[] | undefined
): readonly AvatarStyle[] {
  if (!style) {
    return [];
  }

  return (Array.isArray(style) ? style : [style]) as readonly AvatarStyle[];
}

describe("UserAvatar", () => {
  it("should render image when imageUrl is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={50}
      />
    );

    const image = asAvatarTestInstance(UNSAFE_getByType(Image));
    expect(image).toBeTruthy();
    expect(image.props.source).toMatchObject({
      uri: "https://example.com/avatar.jpg",
    });
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
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar
        imageUrl="https://example.com/avatar.jpg"
        name="John Doe"
        size={60}
      />
    );

    const image = asAvatarTestInstance(UNSAFE_getByType(Image));
    const styles = getStyles(image.props.style);
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 60, height: 60, borderRadius: 30 }),
      ])
    );
  });

  it("should apply correct size to initials container", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" size={60} />
    );

    const container = asAvatarTestInstance(UNSAFE_getByType(View));
    const styles = getStyles(container.props.style);
    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: 60, height: 60, borderRadius: 30 }),
      ])
    );
  });

  it("should render initials with correct font size", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" size={50} />
    );

    const text = asAvatarTestInstance(UNSAFE_getByType(Text));
    const styles = getStyles(text.props.style);
    expect(styles).toEqual(
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

    const containers = asAvatarTestInstances(UNSAFE_getAllByType(View));
    const firstBg = getStyles(containers[0]?.props.style).find(
      (style) => style.backgroundColor
    )?.backgroundColor;
    const secondBg = getStyles(containers[1]?.props.style).find(
      (style) => style.backgroundColor
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

    const containers = asAvatarTestInstances(UNSAFE_getAllByType(View));
    const firstBg = getStyles(containers[0]?.props.style).find(
      (style) => style.backgroundColor
    )?.backgroundColor;
    const secondBg = getStyles(containers[1]?.props.style).find(
      (style) => style.backgroundColor
    )?.backgroundColor;

    expect(firstBg).not.toBe(secondBg);
  });

  it("should use default size when size prop is not provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <UserAvatar name="John Doe" />
    );

    const container = asAvatarTestInstance(UNSAFE_getByType(View));
    const styles = getStyles(container.props.style);
    expect(styles).toEqual(
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

    const image = asAvatarTestInstance(UNSAFE_getByType(Image));
    expect(image.props.onError).toBeDefined();
  });
});
