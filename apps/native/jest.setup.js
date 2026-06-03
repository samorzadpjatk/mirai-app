import "@testing-library/jest-native/extend-expect";
import { server } from "./src/test-utils/msw/server";

// Mock WebSocket for oRPC client initialization in tests
class MockWebSocket {
  readyState = 0;
  onopen = null;
  onmessage = null;
  onclose = null;
  onerror = null;
  addEventListener = jest.fn((event, handler) => {
    if (event === "open") this.onopen = handler;
    if (event === "message") this.onmessage = handler;
    if (event === "close") this.onclose = handler;
    if (event === "error") this.onerror = handler;
  });
  removeEventListener = jest.fn();
  send = jest.fn();
  close = jest.fn(() => {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = null;
    }
    this.readyState = 3;
    if (this.onclose) this.onclose();
  });
  constructor() {
    this._openTimer = setTimeout(() => {
      this._openTimer = null;
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 0);
  }
}
globalThis.WebSocket = MockWebSocket;

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close MSW server after all tests
afterAll(() => server.close());

jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.setUpTests();
  return Reanimated;
});

jest.mock("react-native-gesture-handler", () => {
  return {
    Gesture: {
      Pan: () => ({
        enabled: jest.fn().mockReturnThis(),
        minDistance: jest.fn().mockReturnThis(),
        onBegin: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
    GestureDetector: ({ children }) => children,
  };
});

jest.mock("@maplibre/maplibre-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MapView: ({ children, testID, ...props }) =>
      React.createElement(View, { testID: testID || "map-view", ...props }, children),
    Camera: "Camera",
    UserLocation: "UserLocation",
    PointAnnotation: "PointAnnotation",
    VectorSource: "VectorSource",
    RasterSource: "RasterSource",
    RasterLayer: "RasterLayer",
  };
});

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(() => ({})),
}));

jest.mock("expo-notifications", () => ({
  PermissionStatus: {
    UNDETERMINED: "undetermined",
    GRANTED: "granted",
    DENIED: "denied",
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function Ionicons(props) {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { testID: "ionicon", ...props }, props.name);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  SafeAreaProvider: ({ children }) => children,
}));

// Global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});

// Suppress expected console warnings that are not actual test failures
const originalError = console.error;
const originalWarn = console.warn;

// Patterns for expected warnings that should be suppressed
const SUPPRESSED_PATTERNS = [
  // React act() warnings - expected in React 18+ concurrent rendering
  /An update to .* inside a test was not wrapped in act/,
  // React state updates during cleanup
  /Can't perform a React state update on an unmounted component/,
  // Navigation warnings in test environment
  /The 'navigation' object hasn't been initialized/,
  // Expo/React Native specific warnings
  /Require cycle:/,
  // Animated warnings in tests
  /Animated: `useNativeDriver` is not supported/,
  // Style warnings that don't affect tests
  /StyleSheet: '.*' is not a valid style property/,
  // Image/Asset warnings in test environment
  /Image source is empty/,
  // Modal/Portal warnings
  /Modal is not supported/,
  // Operational error handling - expected in error test scenarios
  /Failed to toggle location sharing/,
  /Failed to request location permissions/,
  /Failed to load location settings/,
  /Failed to synchronize background location/,
  /Failed to open system settings/,
  /Failed to persist selected trip/,
  /Failed to write cache key/,
  /Error toggling notifications/,
  /Error.*Subscribe failed/,
  /Error.*Storage error/,
  /Error.*Server error/,
  /Error.*Download failed/,
  /Error.*Network error/,
  /Error.*Permission error/,
  /Error.*Task error/,
  /Error checking for updates/,
  /Error downloading update/,
  /\[Upload\] Failed to start upload/,
  /\[MSW\] Error: intercepted a WebSocket connection without a matching event handler/,
];

// Helper to check if a message should be suppressed
const shouldSuppress = (message) => {
  return SUPPRESSED_PATTERNS.some((pattern) => pattern.test(message));
};

// Override console.error to filter expected warnings
console.error = (...args) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalError.apply(console, args);
  }
};

// Override console.warn to filter expected warnings
console.warn = (...args) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalWarn.apply(console, args);
  }
};

// Restore original methods after all tests
global.afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
