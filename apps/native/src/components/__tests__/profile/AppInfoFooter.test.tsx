import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { AppInfoFooter } from "../../profile/AppInfoFooter";

describe("AppInfoFooter", () => {
  it("renders version and copyright labels", () => {
    renderWithProviders(
      <AppInfoFooter versionLabel="Version 1.0.0" copyrightLabel="© 2024 Company" />,
    );

    expect(screen.getByText("Version 1.0.0")).toBeOnTheScreen();
    expect(screen.getByText("© 2024 Company")).toBeOnTheScreen();
  });

  it("renders long labels", () => {
    const version = "Version 1.0.0-beta.2+build.123 (Debug)";
    const copyright = "© 2024 Company Name. All rights reserved.";

    renderWithProviders(<AppInfoFooter versionLabel={version} copyrightLabel={copyright} />);

    expect(screen.getByText(version)).toBeOnTheScreen();
    expect(screen.getByText(copyright)).toBeOnTheScreen();
  });
});
