import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useMapActions } from "../../map/useMapActions";

describe("useMapActions (MSW)", () => {
  it("should return sendLocation function", async () => {
    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    expect(typeof result.current.sendLocation).toBe("function");
  });

  it("should return isSendingLocation as false initially", async () => {
    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    expect(result.current.isSendingLocation).toBe(false);
  });

  it("should send location with correct data via mutation", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: 52.2297,
      longitude: 21.0122,
    });

    expect(capturedInput).toEqual({
      latitude: 52.2297,
      longitude: 21.0122,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle negative coordinates", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: -33.8688,
      longitude: -151.2093,
    });

    expect(capturedInput).toEqual({
      latitude: -33.8688,
      longitude: -151.2093,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle zero coordinates", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: 0,
      longitude: 0,
    });

    expect(capturedInput).toEqual({
      latitude: 0,
      longitude: 0,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should return mutation result", async () => {
    const mockResult = { id: "location-1", timestamp: 1234567890 };

    server.use(createORPCHandler(["location", "updateLocation"], () => mockResult));

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    const returnedResult = await result.current.sendLocation({
      latitude: 52.2297,
      longitude: 21.0122,
    });

    expect(returnedResult).toEqual(mockResult);
  });

  it("should propagate mutation errors", async () => {
    server.use(
      createORPCHandler(["location", "updateLocation"], () => {
        throw new Error("Network error");
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await expect(
      result.current.sendLocation({
        latitude: 52.2297,
        longitude: 21.0122,
      }),
    ).rejects.toThrow();
  });

  it("should return isSendingLocation as true when mutation is pending", async () => {
    let resolveMutation: ((value: unknown) => void) | undefined;

    server.use(
      createORPCHandler(["location", "updateLocation"], () => {
        return new Promise((resolve) => {
          resolveMutation = resolve;
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    const sendPromise = result.current.sendLocation({
      latitude: 52.2297,
      longitude: 21.0122,
    });

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(true);
    });

    expect(result.current.isSendingLocation).toBe(true);

    resolveMutation!({ success: true });
    await sendPromise;

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });
  });

  it("should handle high precision coordinates", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: 52.22976666111,
      longitude: 21.01223333888,
    });

    expect(capturedInput).toEqual({
      latitude: 52.22976666111,
      longitude: 21.01223333888,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle edge case coordinates near poles", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: 89.9999,
      longitude: 180,
    });

    expect(capturedInput).toEqual({
      latitude: 89.9999,
      longitude: 180,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle edge case coordinates near date line", async () => {
    let capturedInput: unknown;

    server.use(
      createORPCHandler(["location", "updateLocation"], (input) => {
        capturedInput = input;
        return { success: true };
      }),
    );

    const { result } = renderHookWithMSW(() => useMapActions());

    await waitFor(() => {
      expect(result.current.isSendingLocation).toBe(false);
    });

    await result.current.sendLocation({
      latitude: 0,
      longitude: -180,
    });

    expect(capturedInput).toEqual({
      latitude: 0,
      longitude: -180,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });
});
