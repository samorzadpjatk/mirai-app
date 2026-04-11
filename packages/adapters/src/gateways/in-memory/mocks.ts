import type { Role } from "@mirai-app/frameworks/auth";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

// Mock types for Drizzle-based testing (Prisma migration completed)
interface PrismaClientMock {
  [key: string]: unknown;
}

interface UserMock {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  emailVerified: Date | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}

export type MockPrismaClient = {
  [K in keyof PrismaClientMock]: K extends symbol
    ? PrismaClientMock[K]
    : PrismaClientMock[K] extends (...args: infer A) => infer R
      ? (...args: A) => R
      : PrismaClientMock[K];
};

export type MockContext = {
  db: MockPrismaClient;
  supabase: MockSupabaseClient;
  headers: Headers;
  accessToken: string | null;
  user?: MockAuthUser;
  dbUser?: UserMock;
};

type MockSupabaseClient = {
  auth: {
    getSession: ReturnType<typeof mockFn>;
    getUser: ReturnType<typeof mockFn>;
    signInWithOtp: ReturnType<typeof mockFn>;
    signOut: ReturnType<typeof mockFn>;
    onAuthStateChange: ReturnType<typeof mockFn>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function mockFn<T>(returnValue?: T) {
  const fn = (..._args: unknown[]): T | undefined => returnValue;
  return fn as unknown as T & { (): T };
}

function deepMock<T extends object>(): T {
  const handler: ProxyHandler<T> = {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return deepMock<object>();
    },
    apply() {
      return deepMock<object>();
    },
  };
  return new Proxy<T>((() => undefined) as T, handler);
}

export interface CreateMockPrismaClientOptions {
  user?: Partial<MockPrismaClient["user"]>;
  trip?: Partial<MockPrismaClient["trip"]>;
  challenge?: Partial<MockPrismaClient["challenge"]>;
  group?: Partial<MockPrismaClient["group"]>;
  challengeSubmission?: Partial<MockPrismaClient["challengeSubmission"]>;
  challengeVote?: Partial<MockPrismaClient["challengeVote"]>;
  coinTransaction?: Partial<MockPrismaClient["coinTransaction"]>;
  notification?: Partial<MockPrismaClient["notification"]>;
  notificationSchedule?: Partial<MockPrismaClient["notificationSchedule"]>;
  notificationDelivery?: Partial<MockPrismaClient["notificationDelivery"]>;
  location?: Partial<MockPrismaClient["location"]>;
  tripParticipant?: Partial<MockPrismaClient["tripParticipant"]>;
  activityFeed?: Partial<MockPrismaClient["activityFeed"]>;
  reward?: Partial<MockPrismaClient["reward"]>;
  sponsor?: Partial<MockPrismaClient["sponsor"]>;
  [key: string]: unknown;
}

const ALL_MODELS = [
  "user",
  "trip",
  "tripResource",
  "tripInsurance",
  "tripInsuranceStep",
  "tripParticipant",
  "event",
  "userEvent",
  "group",
  "groupJoinRequest",
  "challenge",
  "challengeSubmission",
  "challengeVote",
  "submissionReport",
  "activityFeed",
  "activityReaction",
  "submissionActivity",
  "challengeActivity",
  "rankChangeActivity",
  "userPost",
  "coinTransaction",
  "notificationSchedule",
  "notification",
  "notificationScheduleExecution",
  "notificationPush",
  "notificationDelivery",
  "pushSubscription",
  "location",
  "locationSharingRequest",
  "reward",
  "rewardPurchase",
  "userAgent",
  "sponsor",
  "tripSponsor",
] as const;

export function createMockPrismaClient(
  options: CreateMockPrismaClientOptions = {},
): MockPrismaClient {
  const mock = deepMock<MockPrismaClient>();

  for (const name of ALL_MODELS) {
    const modelOverrides = (options as CreateMockPrismaClientOptions)[name];
    if (modelOverrides) {
      Object.assign(
        (mock as Record<string, unknown>)[name] as object,
        modelOverrides,
      );
    }
  }

  return mock;
}

export interface CreateMockContextOptions {
  userId?: string;
  role?: Role;
  accessToken?: string | null;
  supabase?: Partial<MockSupabaseClient>;
  db?: Partial<MockPrismaClient> | MockPrismaClient;
}

export function createMockContext(
  options: CreateMockContextOptions = {},
): MockContext {
  const {
    userId = "test-user-id",
    role = "USER",
    accessToken = "test-token",
  } = options;

  const mockDb = createMockPrismaClient(
    options.db as CreateMockPrismaClientOptions,
  );
  const mockSupabase = deepMock<MockSupabaseClient>();

  return {
    db: mockDb as MockPrismaClient,
    supabase: mockSupabase as unknown as SupabaseClient,
    headers: new Headers(),
    accessToken,
    user: {
      id: userId,
      authUserId: userId,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      name: "Test User",
      emailVerified: null,
      role,
    },
    dbUser: {
      id: userId,
      authUserId: userId,
      email: "test@example.com",
      name: "Test User",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as unknown as MockContext;
}
