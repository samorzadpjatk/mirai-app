import { vi } from "vitest";

/**
 * Vitest setup file helper.
 * Provides common setup patterns for Vitest test files.
 */

/**
 * Standard Vitest mock setup for Supabase.
 * Import and call this in your vitest.setup.ts file.
 */
export function setupSupabaseMocks(): void {
  vi.mock("@supabase/supabase-js", () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        signInWithPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
      from: vi.fn(() => ({ ...mockQueryBuilder })),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
        })),
      },
    };

    return {
      createClient: vi.fn(() => mockSupabaseClient),
    };
  });
}

/**
 * Standard Vitest mock setup for Prisma.
 * Import and call this in your vitest.setup.ts file.
 */
export function setupPrismaMocks(): void {
  vi.mock("@mirai-app/db", () => {
    const mockPrismaClient = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      user: createMockPrismaModel(),
      trip: createMockPrismaModel(),
      event: createMockPrismaModel(),
      $transaction: vi.fn((cb: (client: typeof mockPrismaClient) => Promise<unknown[]>) =>
        cb(mockPrismaClient)
      ),
    };

    return {
      prisma: mockPrismaClient,
      PrismaClient: vi.fn(() => mockPrismaClient),
    };
  });
}

/**
 * Creates a mock Prisma model with standard CRUD operations.
 */
function createMockPrismaModel() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
  };
}

/**
 * Standard Vitest mock setup for Expo modules.
 * Import and call this in your vitest.setup.ts file for React Native tests.
 */
export function setupExpoMocks(): void {
  // Mock expo modules
  vi.mock("expo-constants", () => ({
    default: {
      expoConfig: {
        extra: {
          supabaseUrl: "https://test.supabase.co",
          supabaseAnonKey: "test-anon-key",
        },
      },
    },
  }));

  vi.mock("expo-secure-store", () => ({
    getItemAsync: vi.fn().mockResolvedValue(null),
    setItemAsync: vi.fn().mockResolvedValue(undefined),
    deleteItemAsync: vi.fn().mockResolvedValue(undefined),
  }));

  vi.mock("expo-notifications", () => ({
    getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
    requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
    getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: "test-push-token" }),
    setNotificationChannelAsync: vi.fn().mockResolvedValue(undefined),
    scheduleNotificationAsync: vi.fn().mockResolvedValue("notification-id"),
    cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined),
  }));

  vi.mock("expo-device", () => ({
    isDevice: true,
    brand: "Apple",
    modelName: "iPhone 14",
  }));
}

/**
 * Standard Vitest mock setup for React Native.
 * Import and call this in your vitest.setup.ts file.
 */
export function setupReactNativeMocks(): void {
  vi.mock("react-native", () => ({
    Platform: {
      OS: "ios",
      select: vi.fn((obj: Record<string, unknown>) => obj.ios),
    },
    Alert: {
      alert: vi.fn(),
    },
    Linking: {
      openURL: vi.fn().mockResolvedValue(undefined),
      canOpenURL: vi.fn().mockResolvedValue(true),
    },
    AsyncStorage: {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
    },
  }));
}

/**
 * Complete Vitest setup for Node.js packages.
 * Includes Supabase and Prisma mocks.
 */
export function setupNodeMocks(): void {
  setupSupabaseMocks();
  setupPrismaMocks();
}

/**
 * Complete Vitest setup for React Native packages.
 * Includes all Node mocks plus Expo and React Native mocks.
 */
export function setupReactNativeMocksComplete(): void {
  setupNodeMocks();
  setupExpoMocks();
  setupReactNativeMocks();
}
