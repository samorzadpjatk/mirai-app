import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useTripThemeKey } from "../../trips/useTripThemeKey";

describe("useTripThemeKey (MSW)", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it("returns the theme key from the light trip.getTheme endpoint", async () => {
    server.use(createORPCHandler(["trip", "getTheme"], () => ({ theme: "PIRATE" })));

    const { result } = renderHookWithMSW(() => useTripThemeKey("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTheme).toBe(false);
    });

    expect(result.current.theme).toBe("PIRATE");
  });

  it("stays idle and does not call the API without a trip id", async () => {
    const handler = jest.fn(() => ({ theme: "PIRATE" }));
    server.use(createORPCHandler(["trip", "getTheme"], handler));

    const { result } = renderHookWithMSW(() => useTripThemeKey(null));

    expect(result.current.theme).toBeNull();
    expect(result.current.isLoadingTheme).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("reports null (so the palette falls back to DEFAULT) when the endpoint fails", async () => {
    server.use(
      createORPCHandler(["trip", "getTheme"], () => {
        throw new Error("boom");
      }),
    );

    const { result } = renderHookWithMSW(() => useTripThemeKey("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTheme).toBe(false);
    });

    expect(result.current.theme).toBeNull();
  });
});
