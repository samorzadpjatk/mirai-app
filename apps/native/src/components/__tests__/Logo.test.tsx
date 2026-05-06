import React from "react";
import { Image } from "expo-image";
import { render, screen } from "@testing-library/react-native";
import Logo from "../Logo";

describe("Logo", () => {
  it("renders with default size", () => {
    render(<Logo />);

    expect(screen.UNSAFE_getByType(Image)).toBeTruthy();
  });

  it("renders with custom size", () => {
    render(<Logo size={60} />);

    expect(screen.UNSAFE_getByType(Image)).toBeTruthy();
  });

  it("renders with small size", () => {
    render(<Logo size={40} />);

    expect(screen.UNSAFE_getByType(Image)).toBeTruthy();
  });

  it("renders with large size", () => {
    render(<Logo size={200} />);

    expect(screen.UNSAFE_getByType(Image)).toBeTruthy();
  });

  it("renders image component", () => {
    render(<Logo />);

    expect(screen.UNSAFE_getByType(Image)).toBeTruthy();
  });
});
