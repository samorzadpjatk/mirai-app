import "@testing-library/jest-native/extend-expect";

// Mock Expo modules
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {},
  },
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn((path) => `mirai:///${path}`),
  parse: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  useURL: jest.fn(),
  useInitialURL: jest.fn(() => ({ url: null, loading: false })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  getLinkingURL: jest.fn(),
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  MediaTypeOptions: {
    Images: "Images",
    Videos: "Videos",
    All: "All",
  },
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  requestBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 52.2297,
        longitude: 21.0122,
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  hasServicesEnabledAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 1 })
  ),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 1 })
  ),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notification-id")),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  removeNotificationSubscription: jest.fn(),
  NotificationBehavior: {
    DEFAULT: "default",
  },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(() => Promise.resolve("mock-hash")),
  CryptoDigestAlgorithm: {
    SHA256: "SHA-256",
  },
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///mock/documents/",
  cacheDirectory: "file:///mock/cache/",
  getInfoAsync: jest.fn(() =>
    Promise.resolve({ exists: true, isDirectory: true })
  ),
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
  FileSystemUploadType: {
    BINARY_CONTENT: 0,
    MULTIPART: 1,
  },
}));

jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: jest.fn(() => [
    { granted: true },
    jest.fn(() => Promise.resolve({ granted: true })),
  ]),
  CameraType: {
    back: "back",
    front: "front",
  },
}));

jest.mock("expo-asset", () => ({
  useAssets: jest.fn(() => [[]]),
}));

jest.mock("expo-linear-gradient", () => ("LinearGradient"));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  useUpdates: jest.fn(() => ({
    isUpdateAvailable: false,
    isUpdatePending: false,
    checkError: null,
    downloadError: null,
    lastCheckForUpdateTimeSinceRestart: null,
  })),
}));

jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekBy: jest.fn(),
    replay: jest.fn(),
    duration: 0,
    time: 0,
    paused: false,
    muted: false,
    volume: 1,
  })),
}));

jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(),
  unregisterAllTasksAsync: jest.fn(),
}));

// Mock React Native modules
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("react-native-gesture-handler", () => ({
  State: {},
  PanGestureHandler: "PanGestureHandler",
  TapGestureHandler: "TapGestureHandler",
  LongPressGestureHandler: "LongPressGestureHandler",
  RotationGestureHandler: "RotationGestureHandler",
  PinchGestureHandler: "PinchGestureHandler",
  FlingGestureHandler: "FlingGestureHandler",
  ForceTouchGestureHandler: "ForceTouchGestureHandler",
  RawButton: "RawButton",
  BaseButton: "BaseButton",
  RectButton: "RectButton",
  BorderlessButton: "BorderlessButton",
  FlatList: "FlatList",
  ScrollView: "ScrollView",
  Switch: "Switch",
  TextInput: "TextInput",
  ToolbarAndroid: "ToolbarAndroid",
  ViewPagerAndroid: "ViewPagerAndroid",
  DrawerLayoutAndroid: "DrawerLayoutAndroid",
  PureNativeButton: "PureNativeButton",
  TouchableHighlight: "TouchableHighlight",
  TouchableNativeFeedback: "TouchableNativeFeedback",
  TouchableOpacity: "TouchableOpacity",
  TouchableWithoutFeedback: "TouchableWithoutFeedback",
  createNativeWrapper: jest.fn((Component) => Component),
  Directions: {},
  Touchable: "Touchable",
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: "SafeAreaProvider",
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })),
  useSafeAreaFrame: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  })),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 375, height: 812 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  },
}));

jest.mock("react-native-screens", () => ({
  Screen: "Screen",
  ScreenContainer: "ScreenContainer",
  NativeScreen: "NativeScreen",
  NativeScreenContainer: "NativeScreenContainer",
  ScreenStack: "ScreenStack",
  ScreenStackHeaderConfig: "ScreenStackHeaderConfig",
  ScreenStackHeaderSubview: "ScreenStackHeaderSubview",
  ScreenStackHeaderBackButtonImage: "ScreenStackHeaderBackButtonImage",
  ScreenStackHeaderRightView: "ScreenStackHeaderRightView",
  ScreenStackHeaderLeftView: "ScreenStackHeaderLeftView",
  ScreenStackHeaderCenterView: "ScreenStackHeaderCenterView",
  enableScreens: jest.fn(),
  screensEnabled: jest.fn(() => true),
  useScreens: jest.fn(),
  NativeSearchBar: "NativeSearchBar",
  NativeSearchBarCommands: {},
  SearchBar: "SearchBar",
  FullWindowOverlay: "FullWindowOverlay",
  ScreenFooter: "ScreenFooter",
  ScreenContentWrapper: "ScreenContentWrapper",
  isNewArchitectureSupported: jest.fn(() => false),
  isSearchBarAvailableForCurrentPlatform: jest.fn(() => true),
}));

jest.mock("react-native-svg", () => ({
  Svg: "Svg",
  Circle: "Circle",
  Ellipse: "Ellipse",
  G: "G",
  Text: "Text",
  TSpan: "TSpan",
  TextPath: "TextPath",
  Path: "Path",
  Polygon: "Polygon",
  Polyline: "Polyline",
  Line: "Line",
  Rect: "Rect",
  Use: "Use",
  Image: "Image",
  Symbol: "Symbol",
  Defs: "Defs",
  LinearGradient: "LinearGradient",
  RadialGradient: "RadialGradient",
  Stop: "Stop",
  ClipPath: "ClipPath",
  Pattern: "Pattern",
  Mask: "Mask",
  Marker: "Marker",
  ForeignObject: "ForeignObject",
}));

jest.mock("react-native-webview", () => ("WebView"));

jest.mock("react-native-pdf", () => ("Pdf"));

jest.mock("react-native-worklets", () => ({
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
  createWorkletRuntime: jest.fn(),
  WorkletRuntime: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

jest.mock("@react-native-community/datetimepicker", () => ("RNDateTimePicker"));

jest.mock("@react-native-picker/picker", () => ({
  Picker: "Picker",
  PickerItem: "PickerItem",
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => () => {}),
    removeListener: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getParent: jest.fn(),
    getState: jest.fn(),
    getId: jest.fn(),
    setParams: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    reset: jest.fn(),
  })),
  useRoute: jest.fn(() => ({ params: {} })),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(() => true),
  useNavigationState: jest.fn(),
  useLinkTo: jest.fn(),
  useLinkProps: jest.fn(() => ({ href: "", onPress: jest.fn() })),
  useLinkBuilder: jest.fn(() => ({ buildHref: jest.fn((path) => path) })),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
    navigate: jest.fn(),
    reload: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => "/"),
  useSegments: jest.fn(() => []),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
  })),
  Link: "Link",
  Stack: {
    Screen: "Stack.Screen",
  },
  Tabs: {
    Screen: "Tabs.Screen",
  },
  Slot: "Slot",
  Redirect: "Redirect",
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
    navigate: jest.fn(),
    reload: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: jest.fn(() => true),
  },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  FontAwesome: "FontAwesome",
  FontAwesome5: "FontAwesome5",
  Feather: "Feather",
  AntDesign: "AntDesign",
  Entypo: "Entypo",
  EvilIcons: "EvilIcons",
  Foundation: "Foundation",
  Octicons: "Octicons",
  SimpleLineIcons: "SimpleLineIcons",
  Zocial: "Zocial",
}));

jest.mock("nativewind", () => ({
  styled: jest.fn((Component) => Component),
  useColorScheme: jest.fn(() => "light"),
  vars: jest.fn(),
}));

jest.mock("react-native-css-interop", () => ({
  ...jest.requireActual("react-native-css-interop"),
  useColorScheme: jest.fn(() => "light"),
}));

// Mock @mirai-app packages
jest.mock("@mirai-app/supabase", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      containedBy: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      and: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      csv: jest.fn().mockReturnThis(),
      abortSignal: jest.fn().mockReturnThis(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: "" } })),
        createSignedUrl: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      })),
    },
    realtime: {
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  })),
}));

jest.mock("@mirai-app/auth", () => ({
  useAuth: jest.fn(() => ({
    user: null,
    session: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@mirai-app/trpc", () => ({
  trpc: {
    useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
    useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
    useInfiniteQuery: jest.fn(() => ({ data: null, isLoading: false, error: null, fetchNextPage: jest.fn() })),
    useSubscription: jest.fn(),
  },
  TRPCProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@mirai-app/shared", () => ({
  formatDate: jest.fn((date: Date) => date.toISOString()),
  formatCurrency: jest.fn((amount: number) => `$${amount.toFixed(2)}`),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
  useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    clear: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    clear: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  dehydrate: jest.fn(),
  hydrate: jest.fn(),
  focusManager: {
    setEventListener: jest.fn(),
  },
  onlineManager: {
    setEventListener: jest.fn(),
  },
}));

jest.mock("@tanstack/query-core", () => ({
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    clear: jest.fn(),
  })),
}));

// Mock zustand
jest.mock("zustand", () => {
  const actual = jest.requireActual("zustand");
  return {
    __esModule: true,
    ...actual,
    default: jest.fn((createState) => {
      const store = actual.default(createState);
      const initialState = store.getState();
      return Object.assign(
        (...args: unknown[]) => store(...args),
        store,
        {
          getState: () => initialState,
          setState: jest.fn(),
          subscribe: jest.fn(),
          destroy: jest.fn(),
        }
      );
    }),
  };
});

// Mock tus-js-client
jest.mock("tus-js-client", () => ({
  Upload: jest.fn(() => ({
    start: jest.fn(),
    abort: jest.fn(),
    findPreviousUploads: jest.fn(),
  })),
  isSupported: true,
  canStoreURLs: true,
  defaultOptions: {},
}));

// Mock @maplibre/maplibre-react-native
jest.mock("@maplibre/maplibre-react-native", () => ({
  MapView: "MapView",
  Camera: "Camera",
  MarkerView: "MarkerView",
  PointAnnotation: "PointAnnotation",
  Callout: "Callout",
  UserLocation: "UserLocation",
  ShapeSource: "ShapeSource",
  LineLayer: "LineLayer",
  FillLayer: "FillLayer",
  CircleLayer: "CircleLayer",
  SymbolLayer: "SymbolLayer",
  RasterLayer: "RasterLayer",
  BackgroundLayer: "BackgroundLayer",
  Images: "Images",
  Light: "Light",
  Terrain: "Terrain",
  Atmosphere: "Atmosphere",
  HeatmapLayer: "HeatmapLayer",
  SkyLayer: "SkyLayer",
  VectorSource: "VectorSource",
  RasterSource: "RasterSource",
  ImageSource: "ImageSource",
  RasterDemSource: "RasterDemSource",
  setAccessToken: jest.fn(),
  setTelemetryEnabled: jest.fn(),
  getMetricsEnabled: jest.fn(),
  setMetricsEnabled: jest.fn(),
  requestAndroidLocationPermissions: jest.fn(),
}));

// Global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
