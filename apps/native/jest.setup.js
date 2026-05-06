import "@testing-library/jest-native/extend-expect";

// Mock expo-image before other imports - must mock before expo-modules-core loads
jest.mock("expo-image", () => ({
  Image: jest.fn(() => null),
  __esModule: true,
  default: jest.fn(() => null)
}));

jest.mock("expo", () => ({
  __esModule: true,
  default: {},
}));

// Mock react-native-safe-area-context early (used by test helpers)
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
    Promise.resolve({ granted: true, status: "granted" })
  ),
  requestBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" })
  ),
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" })
  ),
  getBackgroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: "granted" })
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
  hasStartedLocationUpdatesAsync: jest.fn(() => Promise.resolve(false)),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
  },
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  ActivityType: {
    Other: 1,
    AutomotiveNavigation: 2,
    Fitness: 3,
    OtherNavigation: 4,
    Airborne: 5,
  },
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

jest.mock("expo-file-system", () => {
  // Mock implementations for Directory and File classes
  const mockDirectory = {
    exists: true,
    create: jest.fn(),
  };

  const mockFile = {
    exists: false,
    delete: jest.fn(),
    copy: jest.fn(),
    uri: "file://test.jpg",
    size: 1024,
  };

  return {
    documentDirectory: "file:///mock/documents/",
    cacheDirectory: "file:///mock/cache/",
    Paths: {
      document: "file://documents/",
    },
    Directory: jest.fn(() => mockDirectory),
    File: jest.fn(() => mockFile),
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
  };
});

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
  const React = require("react");
  return {
    View: "View",
    Text: "Text",
    Image: "Image",
    ScrollView: "ScrollView",
    FlatList: "FlatList",
    TouchableOpacity: "TouchableOpacity",
    TouchableWithoutFeedback: "TouchableWithoutFeedback",
    TouchableHighlight: "TouchableHighlight",
    TouchableNativeFeedback: "TouchableNativeFeedback",
    Animated: {
      View: "Animated.View",
      Text: "Animated.Text",
      Image: "Animated.Image",
      ScrollView: "Animated.ScrollView",
      FlatList: "Animated.FlatList",
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    useDerivedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedReaction: jest.fn(),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    useAnimatedRef: jest.fn(() => React.useRef(null)),
    createAnimatedComponent: jest.fn((component) => component),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withDecay: jest.fn((value) => value),
    withDelay: jest.fn((_, value) => value),
    withSequence: jest.fn((...args) => args[args.length - 1]),
    withRepeat: jest.fn((value) => value),
    interpolate: jest.fn(() => 0),
    Extrapolate: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    FadeIn: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    FadeOut: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    SlideInRight: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    SlideOutRight: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    ZoomIn: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    ZoomOut: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    Layout: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    EntryExitTransition: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
    Transition: { duration: jest.fn(() => ({ springify: jest.fn(() => ({ build: () => ({}) })) })) },
  };
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
  Gesture: {
    Pan: jest.fn(() => ({
      onBegin: jest.fn(function() { return this; }),
      onUpdate: jest.fn(function() { return this; }),
      onEnd: jest.fn(function() { return this; }),
      enabled: jest.fn(function() { return this; }),
    })),
    Tap: jest.fn(() => ({
      onBegin: jest.fn(function() { return this; }),
      onEnd: jest.fn(function() { return this; }),
    })),
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
  __esModule: true,
  default: {
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
  }
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
  NavigationContainer: "NavigationContainer",
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

// @expo/vector-icons is mocked via __mocks__/@expo/vector-icons.js

// Mock superjson before @mirai-app/trpc
jest.mock("superjson", () => ({
  __esModule: true,
  default: {
    serialize: jest.fn((data) => ({ json: data })),
    deserialize: jest.fn((data) => data.json),
    stringify: jest.fn(JSON.stringify),
    parse: jest.fn(JSON.parse),
  },
  serialize: jest.fn((data) => ({ json: data })),
  deserialize: jest.fn((data) => data.json),
}));

// Mock @mirai-app/trpc to avoid superjson ES module issues
jest.mock("@mirai-app/trpc", () => ({
  trpc: {
    useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
    useMutation: jest.fn(() => ({ mutate: jest.fn(), isLoading: false, error: null })),
    useInfiniteQuery: jest.fn(() => ({ data: null, isLoading: false, error: null, fetchNextPage: jest.fn() })),
    useSubscription: jest.fn(),
  },
  TRPCProvider: ({ children }) => children,
}));

jest.mock("react-native-css-interop", () => ({
  useColorScheme: jest.fn(() => "light"),
  vars: jest.fn(),
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
jest.mock("@tanstack/react-query", () => {
  const React = require("react");

  // Create a proper QueryClient class mock with mount method for v5 compatibility
  class MockQueryClient {
    constructor(options?: any) {
      this.invalidateQueries = jest.fn();
      this.refetchQueries = jest.fn();
      this.setQueryData = jest.fn();
      this.getQueryData = jest.fn();
      this.clear = jest.fn();
      this.mount = jest.fn(() => () => {}); // Returns cleanup function
      this.unmount = jest.fn();
      this.isFetching = jest.fn(() => 0);
      this.isMutating = jest.fn(() => 0);
      this.getQueryCache = jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() }));
      this.getMutationCache = jest.fn(() => ({ onSuccess: jest.fn(), onError: jest.fn() }));
    }
    invalidateQueries: jest.Mock;
    refetchQueries: jest.Mock;
    setQueryData: jest.Mock;
    getQueryData: jest.Mock;
    clear: jest.Mock;
    mount: jest.Mock;
    unmount: jest.Mock;
    isFetching: jest.Mock;
    isMutating: jest.Mock;
    getQueryCache: jest.Mock;
    getMutationCache: jest.Mock;
  }

  const QueryClientProvider = ({ children, client }: { children: React.ReactNode; client: any }) => {
    // Call mount when provider mounts (v5 requirement)
    React.useEffect(() => {
      if (client?.mount) {
        const cleanup = client.mount();
        return cleanup;
      }
    }, [client]);
    return children;
  };

  return {
    useQuery: jest.fn(() => ({ data: null, isLoading: false, error: null })),
    useMutation: jest.fn((options) => ({
      mutate: jest.fn((args) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      }),
      isLoading: false,
      error: null,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      refetchQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      clear: jest.fn(),
      mount: jest.fn(() => () => {}),
    })),
    QueryClient: MockQueryClient,
    QueryClientProvider,
    dehydrate: jest.fn(),
    hydrate: jest.fn(),
    focusManager: {
      setEventListener: jest.fn(),
    },
    onlineManager: {
      setEventListener: jest.fn(),
    },
  };
});

jest.mock("@tanstack/query-core", () => ({
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    refetchQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    clear: jest.fn(),
  })),
}));

jest.mock("zustand", () => {
  const actual = jest.requireActual("zustand");
  return {
    __esModule: true,
    ...actual,
    default: jest.fn((createState) => {
      const store = actual.default(createState);
      let currentState = store.getState();
      return Object.assign(
        (...args) => store(...args),
        store,
        {
          getState: () => currentState,
          setState: (updater) => {
            if (typeof updater === "function") {
              currentState = updater(currentState);
            } else {
              currentState = { ...currentState, ...updater };
            }
          },
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
