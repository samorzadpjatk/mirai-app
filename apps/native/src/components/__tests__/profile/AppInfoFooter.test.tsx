import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AppInfoFooter } from "../../profile/AppInfoFooter";

describe("AppInfoFooter", () => {
  it("renders version and copyright labels", () => {
    const { getByText } = renderWithProviders(
      <AppInfoFooter versionLabel="Version 1.0.0" copyrightLabel="© 2024 Company" />
    );

    expect(getByText("Version 1.0.0")).toBeTruthy();
    expect(getByText("© 2024 Company")).toBeTruthy();
  });

  it("renders long labels", () => {
    const version = "Version 1.0.0-beta.2+build.123 (Debug)";
    const copyright = "© 2024 Company Name. All rights reserved.";

    const { getByText } = renderWithProviders(
      <AppInfoFooter versionLabel={version} copyrightLabel={copyright} />
    );

    expect(getByText(version)).toBeTruthy();
    expect(getByText(copyright)).toBeTruthy();
  });
});
