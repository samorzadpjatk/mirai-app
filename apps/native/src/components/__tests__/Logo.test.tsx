import React from "react";
import { render } from "@testing-library/react-native";
import Logo from "../Logo";

describe("Logo", () => {
  it("renders with default size", () => {
    const { toJSON } = render(<Logo />);
    
    expect(toJSON()).toBeTruthy();
  });

  it("renders with custom size", () => {
    const { toJSON } = render(<Logo size={60} />);
    
    expect(toJSON()).toBeTruthy();
  });

  it("renders with small size", () => {
    const { toJSON } = render(<Logo size={40} />);
    
    expect(toJSON()).toBeTruthy();
  });

  it("renders with large size", () => {
    const { toJSON } = render(<Logo size={200} />);
    
    expect(toJSON()).toBeTruthy();
  });

  it("renders image component", () => {
    const { toJSON } = render(<Logo />);
    
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });
});
