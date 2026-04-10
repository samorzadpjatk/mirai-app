// Jest setup file - runs after Jest is initialized
// This file configures global mocks and test environment

// Set environment variables BEFORE any imports that use runtimeEnv
// Note: runtimeEnv.ts uses EXPO_PUBLIC_ prefix
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
process.env.EXPO_PUBLIC_TRPC_API_URL = "http://localhost:3001/trpc";
process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = "https://example.com/privacy";

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console output during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Mock React Native's Platform
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "ios",
  select: jest.fn((obj) => obj.ios),
  Version: 16,
  isPad: false,
  isTV: false,
  isTesting: true,
}));

// Mock react-native's Dimensions
jest.mock("react-native/Libraries/Utilities/Dimensions", () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock react-native's PixelRatio
jest.mock("react-native/Libraries/Utilities/PixelRatio", () => ({
  get: jest.fn(() => 2),
  roundToNearestPixel: jest.fn((value) => Math.round(value * 2) / 2),
  getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
  getFontScale: jest.fn(() => 1),
}));

// Mock react-native Alert
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
  prompt: jest.fn(),
}));

// Mock react-native main exports
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios),
    Version: 16,
    isPad: false,
    isTV: false,
    isTesting: false,
  },
  Alert: {
    alert: jest.fn(),
    prompt: jest.fn(),
  },
  View: "View",
  Text: "Text",
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  ActivityIndicator: "ActivityIndicator",
  Image: "Image",
  TextInput: "TextInput",
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    roundToNearestPixel: jest.fn((val) => val),
  },
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  expoConfig: {
    name: "mirai-app",
    version: "1.0.0",
  },
  manifest: {},
  systemFonts: [],
  statusBarHeight: 44,
  platform: {
    ios: {
      model: "iPhone",
      platform: "iOS",
      systemVersion: "16.0",
    },
  },
}));

// Mock expo-asset
jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
      uri: "mock-asset-uri",
    })),
    loadAsync: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  WHEN_UNLOCKED: "whenUnlocked",
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly",
  AFTER_FIRST_UNLOCK: "afterFirstUnlock",
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "afterFirstUnlockThisDeviceOnly",
  ALWAYS: "always",
  ALWAYS_THIS_DEVICE_ONLY: "alwaysThisDeviceOnly",
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: "whenPasscodeSetThisDeviceOnly",
}));

// Mock expo-task-manager
jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => true),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(true)),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterAllTasksAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-location
jest.mock("expo-location", () => ({
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  ActivityType: {
    Other: 0,
    AutomotiveNavigation: 1,
    Fitness: 2,
    OtherNavigation: 3,
    Airborne: 4,
  },
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  hasStartedLocationUpdatesAsync: jest.fn(() => Promise.resolve(false)),
  startLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
  stopLocationUpdatesAsync: jest.fn(() => Promise.resolve()),
  requestBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" }),
  ),
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" }),
  ),
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, status: "undetermined" }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 0,
        longitude: 0,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    }),
  ),
}));

// Mock @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiMerge: jest.fn(() => Promise.resolve()),
  mergeItem: jest.fn(() => Promise.resolve()),
  flushGetRequests: jest.fn(),
  useAsyncStorage: jest.fn((key) => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock expo-image-manipulator
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(() =>
    Promise.resolve({
      uri: "mock-manipulated-image-uri",
      width: 100,
      height: 100,
    }),
  ),
  SaveFormat: {
    JPEG: "jpeg",
    PNG: "png",
    WEBP: "webp",
  },
  FlipType: {
    Vertical: "vertical",
    Horizontal: "horizontal",
  },
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: "mock-image-uri",
          width: 100,
          height: 100,
          type: "image",
        },
      ],
    }),
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: "mock-camera-image-uri",
          width: 100,
          height: 100,
          type: "image",
        },
      ],
    }),
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" }),
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" }),
  ),
  MediaTypeOptions: {
    All: "all",
    Images: "images",
    Videos: "videos",
  },
  ImageQuality: {
    MAX: 1,
    HIGH: 0.8,
    MEDIUM: 0.5,
    LOW: 0.3,
    MIN: 0.1,
  },
}));

// Mock expo-linking
jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `mirai-app://${path}`),
  openURL: jest.fn(() => Promise.resolve(true)),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  useURL: jest.fn(() => null),
  useInitialURL: jest.fn(() => ({ url: null, loading: false })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  parse: jest.fn((url) => ({
    hostname: "localhost",
    path: url,
    queryParams: {},
  })),
  makeUrl: jest.fn((path) => `mirai-app://${path}`),
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  dismissShareDialog: jest.fn(() => Promise.resolve()),
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: jest.fn(() => null),
  setStatusBarStyle: jest.fn(),
  setStatusBarHidden: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
  setStatusBarTranslucent: jest.fn(),
  setStatusBarNetworkActivityIndicatorVisible: jest.fn(),
}));

// Mock expo-crypto
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(() => Promise.resolve("mock-digest")),
  getRandomBytes: jest.fn(() => new Uint8Array(16)),
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(16))),
  getRandomUUID: jest.fn(() => "mock-uuid"),
  CryptoDigestAlgorithm: {
    SHA1: "SHA-1",
    SHA256: "SHA-256",
    SHA384: "SHA-384",
    SHA512: "SHA-512",
    MD2: "MD2",
    MD4: "MD4",
    MD5: "MD5",
  },
  CryptoEncoding: {
    HEX: "hex",
    BASE64: "base64",
  },
}));

// Mock nativewind
jest.mock("nativewind", () => ({
  useTailwind: jest.fn(() => ({})),
  styled: jest.fn((component) => component),
}));

// Mock @maplibre/maplibre-react-native
jest.mock("@maplibre/maplibre-react-native", () => ({
  MapView: jest.fn(() => null),
  Camera: jest.fn(() => null),
  MarkerView: jest.fn(() => null),
  PointAnnotation: jest.fn(() => null),
  Callout: jest.fn(() => null),
  UserLocation: jest.fn(() => null),
  Images: jest.fn(() => null),
  ShapeSource: jest.fn(() => null),
  LineLayer: jest.fn(() => null),
  FillLayer: jest.fn(() => null),
  CircleLayer: jest.fn(() => null),
  SymbolLayer: jest.fn(() => null),
  RasterLayer: jest.fn(() => null),
  BackgroundLayer: jest.fn(() => null),
}));

// Mock react-native-pdf
jest.mock("react-native-pdf", () => jest.fn(() => null));

// Mock react-native-webview
jest.mock("react-native-webview", () => jest.fn(() => null));

// Mock expo-video
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekBy: jest.fn(),
    replay: jest.fn(),
    status: "idle",
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
  })),
  VideoPlayer: jest.fn(() => null),
  VideoView: jest.fn(() => null),
}));

// Mock expo-updates
jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve()),
  reloadAsync: jest.fn(() => Promise.resolve()),
  clearUpdateCacheAsync: jest.fn(() => Promise.resolve()),
  useUpdates: jest.fn(() => ({
    isUpdateAvailable: false,
    isUpdatePending: false,
    downloadError: null,
  })),
  currentlyRunning: {
    updateId: "mock-update-id",
    createdAt: new Date().toISOString(),
    runtimeVersion: "1.0.0",
  },
  availableUpdate: null,
  lastCheckForUpdateTimeSinceRestart: new Date(),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useNavigation: jest.fn(() => ({})),
  Stack: {
    Screen: jest.fn(() => null),
  },
}));

// Mock @mirai-app/frameworks/supabase to avoid JSX transform issues
jest.mock("@mirai-app/frameworks/supabase", () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(function () {
        return this;
      }),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  })),
  RealtimePostgresInsertPayload: class {},
}));

// Mock @mirai-app/frameworks/auth to avoid JSX transform issues
jest.mock("@mirai-app/frameworks/auth", () => ({
  AuthStoreProvider: jest.fn(({ children }) => children),
  useAuthStore: jest.fn(() => ({
    session: null,
    user: null,
    loading: false,
  })),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(() => Promise.resolve()),
    isLoading: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Mock @mirai-app/frameworks/trpc/client
jest.mock("@mirai-app/frameworks/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    location: {
      getMySharingSettings: {
        queryOptions: jest.fn(() => ({
          queryKey: ["location", "getMySharingSettings"],
          queryFn: jest.fn(),
        })),
      },
      updateSharingSettings: {
        mutationOptions: jest.fn(() => ({
          mutationKey: ["location", "updateSharingSettings"],
          mutationFn: jest.fn(() => Promise.resolve()),
        })),
      },
    },
  })),
}));

// Mock @mirai-app/frameworks/trpc/client/query
jest.mock("@mirai-app/frameworks/trpc/client/query", () => ({
  invalidateLocationQueries: jest.fn(() => Promise.resolve()),
}));

// Global test utilities
global.__TEST__ = true;
global.__DEV__ = true;
