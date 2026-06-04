import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useMapLocationStream } from "../../map/useMapLocationStream";

const mockUseLocationContext = jest.fn(() => ({
  canViewOthersLocations: true,
  canShareOwnLocation: true,
  isLocationSharingEnabled: true,
  permissionStatus: "granted",
}));

jest.mock("~/stores/location", () => ({
  useLocationContext: (...args: unknown[]) =>
    mockUseLocationContext(...(args as Parameters<typeof mockUseLocationContext>)),
  useLocationStore: jest.fn(),
  locationStore: {},
  setLocationServerUpdater: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn().mockReturnValue("test-uuid-123"),
}));

/**
 * ORPC WebSocket mock that implements the full oRPC peer protocol.
 *
 * Supports multiple listeners per event type (critical because both
 * createWsConnection and WSLink add their own message listeners).
 */
class ORPCWebSocketMock {
  readyState = 0;
  onopen: ((event?: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event?: CloseEvent) => void) | null = null;
  onerror: ((event?: Event) => void) | null = null;
  _listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  _sentMessages: string[] = [];
  _config: {
    responses: Array<{ event: string; data: unknown }>;
  } | null = null;

  constructor() {
    setTimeout(() => {
      this.readyState = 1;
      this._emit("open", {});
    }, 0);
  }

  addEventListener = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
    if (event === "open") this.onopen = handler;
    if (event === "message") this.onmessage = handler;
    if (event === "close") this.onclose = handler;
    if (event === "error") this.onerror = handler;
  });

  removeEventListener = jest.fn();

  send = jest.fn((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (typeof data === "string") {
      this._sentMessages.push(data);
      this._processMessage(data);
    }
  });

  close = jest.fn(() => {
    this.readyState = 3;
    this._emit("close", {});
  });

  _emit(event: string, data: unknown) {
    this._listeners[event]?.forEach((handler) => handler(data));
    if (event === "open" && this.onopen) this.onopen(data as Event);
    if (event === "message" && this.onmessage) this.onmessage(data as MessageEvent);
    if (event === "close" && this.onclose) this.onclose(data as CloseEvent);
    if (event === "error" && this.onerror) this.onerror(data as Event);
  }

  _triggerMessage(data: string) {
    this._emit("message", { data } as MessageEvent);
  }

  _processMessage(data: string) {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "connection_init") {
        setTimeout(() => {
          this._triggerMessage(JSON.stringify({ type: "connection_ack" }));
        }, 0);
      } else if (msg.i !== undefined && msg.p !== undefined) {
        this._handleRequest(msg);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }

  _handleRequest(request: { i: number; p: { u?: string; b?: unknown } }) {
    const { i } = request;

    // Send response with event-stream headers
    const response = {
      i,
      p: {
        h: { "content-type": "text/event-stream" },
      },
    };
    setTimeout(() => {
      this._triggerMessage(JSON.stringify(response));

      // Send event iterator messages
      if (this._config) {
        for (const event of this._config.responses) {
          const eventMsg = {
            i,
            t: 3, // EVENT_ITERATOR
            p: {
              e: event.event,
              d: event.data,
            },
          };
          setTimeout(() => {
            this._triggerMessage(JSON.stringify(eventMsg));
          }, 0);
        }
      }
    }, 0);
  }
}

function createSerializedValue(data: unknown) {
  return { json: data };
}

describe("useMapLocationStream (WebSocket)", () => {
  let activeWebSocket: ORPCWebSocketMock | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationContext.mockReturnValue({
      canViewOthersLocations: true,
      canShareOwnLocation: true,
      isLocationSharingEnabled: true,
      permissionStatus: "granted",
    });

    // Override WebSocket with a mock that captures the active instance
    globalThis.WebSocket = class extends ORPCWebSocketMock {
      constructor() {
        super();
        activeWebSocket = this;
      }
    } as unknown as typeof WebSocket;
  });

  afterEach(() => {
    activeWebSocket = null;
  });

  it("should return locationsByUserId, usersData, and setUsersData", () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    expect(result.current.locationsByUserId).toEqual({});
    expect(result.current.usersData).toEqual({});
    expect(typeof result.current.setUsersData).toBe("function");
  });

  it("should be disabled when enabled is false", async () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(false));

    expect(result.current.locationsByUserId).toEqual({});
    expect(result.current.usersData).toEqual({});
  });

  it("should be disabled when canViewOthersLocations is false", async () => {
    mockUseLocationContext.mockReturnValue({
      canViewOthersLocations: false,
      canShareOwnLocation: true,
      isLocationSharingEnabled: true,
      permissionStatus: "granted",
    });

    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    expect(result.current.locationsByUserId).toEqual({});
    expect(result.current.usersData).toEqual({});
  });

  it("should fetch and process stream events when enabled", async () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    // The oRPC client creates the WebSocket instance when getORPCClient is called
    expect(activeWebSocket).not.toBeNull();

    // Configure the active WebSocket to respond with stream events
    if (activeWebSocket) {
      activeWebSocket._config = {
        responses: [
          {
            event: "message",
            data: createSerializedValue({
              type: "upsert",
              location: {
                user: { id: "user-1", firstName: "John", lastName: "Doe" },
                coords: { latitude: 52.2297, longitude: 21.0122 },
                timestamp: "2024-01-15T10:30:00Z",
              },
            }),
          },
          {
            event: "done",
            data: null,
          },
        ],
      };
    }

    await waitFor(() => {
      expect(result.current.locationsByUserId).toHaveProperty("user-1");
    });

    expect(result.current.locationsByUserId["user-1"]).toEqual({
      latitude: 52.2297,
      longitude: 21.0122,
      updatedAt: "2024-01-15T10:30:00Z",
    });
    expect(result.current.usersData["user-1"]).toEqual({
      name: "John Doe",
      image: undefined,
    });
  });

  it("should process delete events from stream", async () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    expect(activeWebSocket).not.toBeNull();

    if (activeWebSocket) {
      activeWebSocket._config = {
        responses: [
          {
            event: "message",
            data: createSerializedValue({
              type: "upsert",
              location: {
                user: { id: "user-1", firstName: "John", lastName: "Doe" },
                coords: { latitude: 52.2297, longitude: 21.0122 },
                timestamp: "2024-01-15T10:30:00Z",
              },
            }),
          },
          {
            event: "message",
            data: createSerializedValue({
              type: "delete",
              userId: "user-1",
            }),
          },
          {
            event: "done",
            data: null,
          },
        ],
      };
    }

    await waitFor(() => {
      expect(result.current.locationsByUserId).not.toHaveProperty("user-1");
    });

    expect(result.current.usersData).not.toHaveProperty("user-1");
  });

  it("should call AbortController.abort on cleanup", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort").mockImplementation(() => {});

    const { result, unmount } = renderHookWithMSW(() => useMapLocationStream(true));

    expect(activeWebSocket).not.toBeNull();

    if (activeWebSocket) {
      activeWebSocket._config = {
        responses: [
          {
            event: "message",
            data: createSerializedValue({
              type: "upsert",
              location: {
                user: { id: "user-1", firstName: "John", lastName: "Doe" },
                coords: { latitude: 52.2297, longitude: 21.0122 },
                timestamp: "2024-01-15T10:30:00Z",
              },
            }),
          },
          {
            event: "done",
            data: null,
          },
        ],
      };
    }

    await waitFor(() => {
      expect(result.current.locationsByUserId).toHaveProperty("user-1");
    });

    unmount();

    expect(abortSpy).toHaveBeenCalled();

    abortSpy.mockRestore();
  });

  it("should handle non-UNAUTHORIZED errors from the stream", async () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    expect(activeWebSocket).not.toBeNull();

    if (activeWebSocket) {
      activeWebSocket._handleRequest = (request: {
        i: number;
        p: { u?: string; b?: unknown };
      }) => {
        const { i } = request;
        const errorResponse = {
          i,
          p: {
            s: 500,
            b: {
              json: {
                defined: true,
                code: "INTERNAL_SERVER_ERROR",
                status: 500,
                message: "Network error",
                data: null,
              },
              meta: [],
            },
          },
        };
        setTimeout(() => {
          activeWebSocket?._triggerMessage(JSON.stringify(errorResponse));
        }, 0);
      };
    }

    await waitFor(() => {
      expect(result.current.locationsByUserId).toEqual({});
    });

    expect(result.current.usersData).toEqual({});
  });

  it("should allow updating usersData via setUsersData", () => {
    const { result } = renderHookWithMSW(() => useMapLocationStream(true));

    act(() => {
      result.current.setUsersData({
        "user-2": { name: "Jane", image: "https://example.com/jane.jpg" },
      });
    });

    expect(result.current.usersData).toEqual({
      "user-2": { name: "Jane", image: "https://example.com/jane.jpg" },
    });
  });
});
