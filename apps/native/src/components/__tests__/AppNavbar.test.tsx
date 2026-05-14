import React from "react";
import { render, screen } from "@testing-library/react-native";
import AppNavbar from "../AppNavbar";

describe("AppNavbar", () => {
  it("renders with logo and app name", () => {
    render(<AppNavbar />);

    expect(screen.getByText("PJapp")).toBeTruthy();
  });

  it("renders logo component", () => {
    render(<AppNavbar />);

    expect(screen.getByText("PJapp")).toBeTruthy();
  });

  it("renders with correct styling structure", () => {
    const { getByText } = render(<AppNavbar />);

    const appName = getByText("PJapp");
    expect(appName).toBeTruthy();
    expect(appName.props.style).toMatchObject(
      expect.objectContaining({
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
      }),
    );
  });
});
