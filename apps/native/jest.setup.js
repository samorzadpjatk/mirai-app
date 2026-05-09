import "@testing-library/jest-native/extend-expect";

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
];

// Helper to check if a message should be suppressed
const shouldSuppress = (message: string): boolean => {
  return SUPPRESSED_PATTERNS.some(pattern => pattern.test(message));
};

// Override console.error to filter expected warnings
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalError.apply(console, args);
  }
};

// Override console.warn to filter expected warnings
console.warn = (...args: any[]) => {
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
