import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import {
  AdminTripLoadError,
  describeTripLoadError,
} from "~/components/admin/rewards/AdminTripLoadError";

describe("describeTripLoadError", () => {
  it("reports a permission error as a permission error, not a missing trip", () => {
    const copy = describeTripLoadError({ code: "FORBIDDEN" }, null);

    expect(copy.title).toContain("permission");
    expect(copy.title).not.toContain("does not exist");
  });

  it("reports an expired session", () => {
    const copy = describeTripLoadError({ code: "UNAUTHORIZED" }, null);

    expect(copy.title).toContain("session");
  });

  it("keeps the missing-trip wording for a genuine NOT_FOUND", () => {
    const copy = describeTripLoadError({ code: "NOT_FOUND" }, "Summer Camp");

    expect(copy.title).toBe('Trip "Summer Camp" does not exist');
  });

  it("falls back to the error message for unexpected failures", () => {
    const copy = describeTripLoadError(new Error("network down"), null);

    expect(copy.title).toBe("Failed to load trip details");
    expect(copy.hint).toBe("network down");
  });

  it("handles a null error without throwing", () => {
    expect(() => describeTripLoadError(null, null)).not.toThrow();
  });
});

describe("AdminTripLoadError", () => {
  it("renders the permission wording for a moderator hitting the admin-only trip query", () => {
    const { getByTestId } = render(
      <AdminTripLoadError error={{ code: "FORBIDDEN" }} tripName={null} />,
    );

    expect(getByTestId("admin-trip-load-error-title").props.children).toContain("permission");
  });
});
