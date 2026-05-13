import { vi, mocked as vitestMocked, type Mocked } from "vitest";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import type { DB, User } from "@mirai-app/db";
import type { TRPCContext } from "./src/api/trpc";

declare global {
  var mocked: typeof vitestMocked;
  var createDrizzleProxy: (mockDb: MockDbClient) => DB;
}
// @ts-expect-error - adding to globalThis for test compatibility
globalThis.mocked = vitestMocked;
// @ts-expect-error - adding to globalThis for test compatibility
globalThis.createDrizzleProxy = createDrizzleProxy;
if (typeof global !== 'undefined') {
  // @ts-expect-error - adding to global for test compatibility
  global.mocked = vitestMocked;
  // @ts-expect-error - adding to global for test compatibility
  global.createDrizzleProxy = createDrizzleProxy;
}

type MockedFunction<T extends (...args: never[]) => unknown> = Mocked<T>;

export function createMockSupabaseUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: "test-auth-user-id",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { firstName: "Test", lastName: "User" },
    app_metadata: { role: "USER" },
    ...overrides,
  };
}

export function createMockDbUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-db-user-id",
    authUserId: "test-auth-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "USER",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

interface MockSupabaseQueryBuilder {
  select: MockedFunction<() => MockSupabaseQueryBuilder>;
  insert: MockedFunction<() => MockSupabaseQueryBuilder>;
  update: MockedFunction<() => MockSupabaseQueryBuilder>;
  delete: MockedFunction<() => MockSupabaseQueryBuilder>;
  eq: MockedFunction<() => MockSupabaseQueryBuilder>;
  single: MockedFunction<() => Promise<{ data: null; error: null }>>;
}

interface MockSupabaseAuthAdmin {
  getUserById: MockedFunction<(id: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>>;
  listUsers: MockedFunction<() => Promise<{ data: { users: SupabaseUser[] }; error: null }>>;
  createUser: MockedFunction<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>;
  updateUserById: MockedFunction<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>;
  deleteUser: MockedFunction<() => Promise<{ data: Record<string, never>; error: null }>>;
}

interface MockSupabaseAuth {
  getSession: MockedFunction<() => Promise<{ data: { session: null }; error: null }>>;
  getUser: MockedFunction<(token?: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>>;
  signInWithOtp: MockedFunction<() => Promise<{ data: Record<string, never>; error: null }>>;
  signInWithPassword: MockedFunction<() => Promise<{ data: { user: SupabaseUser | null; session: { access_token: string } | null }; error: null }>>;
  signOut: MockedFunction<() => Promise<{ error: null }>>;
  verifyOtp: MockedFunction<() => Promise<{ data: { user: SupabaseUser | null; session: { access_token: string } | null }; error: null }>>;
  onAuthStateChange: MockedFunction<() => { data: { subscription: { unsubscribe: MockedFunction<() => void> } } }>;
  admin: MockSupabaseAuthAdmin;
}

export interface MockSupabaseClient {
  auth: MockSupabaseAuth;
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>;
}

interface MockDbModelMethods<T = unknown> {
  findFirst: MockedFunction<() => Promise<T | null>>;
  findUnique: MockedFunction<() => Promise<T | null>>;
  findMany: MockedFunction<() => Promise<T[]>>;
  create: MockedFunction<() => Promise<T>>;
  update: MockedFunction<() => Promise<T>>;
  upsert: MockedFunction<() => Promise<T>>;
  delete: MockedFunction<() => Promise<T>>;
  count: MockedFunction<() => Promise<number>>;
}

export interface MockDbClient {
  user: MockDbModelMethods<User>;
  tripParticipant: MockDbModelMethods<unknown>;
  trip: MockDbModelMethods<unknown>;
  group: MockDbModelMethods<unknown>;
  userAgent: { create: MockedFunction<() => Promise<unknown>> };
  $connect: MockedFunction<() => Promise<void>>;
  $disconnect: MockedFunction<() => Promise<void>>;
  $transaction: MockedFunction<<T>(callback: (db: MockDbClient) => Promise<T>) => Promise<T>>;
}

function createMockQueryBuilder(): MockSupabaseQueryBuilder {
  const builder: MockSupabaseQueryBuilder = {
    select: vi.fn<() => MockSupabaseQueryBuilder>(() => builder),
    insert: vi.fn<() => MockSupabaseQueryBuilder>(() => builder),
    update: vi.fn<() => MockSupabaseQueryBuilder>(() => builder),
    delete: vi.fn<() => MockSupabaseQueryBuilder>(() => builder),
    eq: vi.fn<() => MockSupabaseQueryBuilder>(() => builder),
    single: vi.fn<() => Promise<{ data: null; error: null }>>(() =>
      Promise.resolve({ data: null, error: null })
    ),
  };
  return builder;
}

function createMockAuthAdmin(): MockSupabaseAuthAdmin {
  const mockUser = createMockSupabaseUser();
  return {
    getUserById: vi.fn<(id: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
    listUsers: vi.fn<() => Promise<{ data: { users: SupabaseUser[] }; error: null }>>(() =>
      Promise.resolve({ data: { users: [mockUser] }, error: null })
    ),
    createUser: vi.fn<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
    updateUserById: vi.fn<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
    deleteUser: vi.fn<() => Promise<{ data: Record<string, never>; error: null }>>(() =>
      Promise.resolve({ data: {}, error: null })
    ),
  };
}

function createMockAuth(): MockSupabaseAuth {
  const mockUser = createMockSupabaseUser();
  return {
    getSession: vi.fn<() => Promise<{ data: { session: null }; error: null }>>(() =>
      Promise.resolve({ data: { session: null }, error: null })
    ),
    getUser: vi.fn<(token?: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null })
    ),
    signInWithOtp: vi.fn<() => Promise<{ data: Record<string, never>; error: null }>>(() =>
      Promise.resolve({ data: {}, error: null })
    ),
    signInWithPassword: vi.fn<() => Promise<{ data: { user: SupabaseUser | null; session: { access_token: string } | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser, session: { access_token: "test-token" } }, error: null })
    ),
    signOut: vi.fn<() => Promise<{ error: null }>>(() =>
      Promise.resolve({ error: null })
    ),
    verifyOtp: vi.fn<() => Promise<{ data: { user: SupabaseUser | null; session: { access_token: string } | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser, session: { access_token: "test-token" } }, error: null })
    ),
    onAuthStateChange: vi.fn<() => { data: { subscription: { unsubscribe: MockedFunction<() => void> } } }>(() => ({
      data: { subscription: { unsubscribe: vi.fn<() => void>() } },
    })),
    admin: createMockAuthAdmin(),
  };
}

export function createMockSupabase(): MockSupabaseClient {
  return {
    auth: createMockAuth(),
    from: vi.fn<(table: string) => MockSupabaseQueryBuilder>(() => createMockQueryBuilder()),
  };
}

function singularize(name: string): string {
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
}

function createDrizzleProxy(mockDb: MockDbClient): DB {
  const chainable = {
    where: () => chainable,
    innerJoin: () => chainable,
    leftJoin: () => chainable,
    orderBy: () => chainable,
    limit: () => chainable,
    offset: () => chainable,
    groupBy: () => chainable,
    having: () => chainable,
    then: (resolve: (value: unknown) => unknown) => resolve([]),
  };

  const db = mockDb as unknown as DB & Record<string, unknown>;

  db.query = new Proxy(
    {},
    {
      get(_, tableName) {
        const modelName = singularize(String(tableName));
        const model = (mockDb as Record<string, unknown>)[modelName];
        if (model && typeof model === "object") {
          return model;
        }
        return {
          findFirst: vi.fn(() => Promise.resolve(null)),
          findUnique: vi.fn(() => Promise.resolve(null)),
          findMany: vi.fn(() => Promise.resolve([])),
          count: vi.fn(() => Promise.resolve(0)),
        };
      },
    }
  );

  db.insert = () => ({
    values: () => ({
      returning: () => Promise.resolve([{}]),
    }),
  });

  db.update = () => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([{}]),
      }),
    }),
  });

  db.delete = () => ({
    where: () => ({
      returning: () => Promise.resolve([{}]),
    }),
  });

  db.select = () => chainable;

  db.transaction = (callback: (tx: DB) => Promise<unknown>) => callback(db);

  return db;
}

export function createMockDb(): MockDbClient {
  const mockUser = createMockDbUser();

  const mockDb: MockDbClient = {
    user: {
      findFirst: vi.fn<() => Promise<User | null>>(() => Promise.resolve(mockUser)),
      findUnique: vi.fn<() => Promise<User | null>>(() => Promise.resolve(mockUser)),
      findMany: vi.fn<() => Promise<User[]>>(() => Promise.resolve([mockUser])),
      create: vi.fn<() => Promise<User>>(() => Promise.resolve(mockUser)),
      update: vi.fn<() => Promise<User>>(() => Promise.resolve(mockUser)),
      upsert: vi.fn<() => Promise<User>>(() => Promise.resolve(mockUser)),
      delete: vi.fn<() => Promise<User>>(() => Promise.resolve(mockUser)),
      count: vi.fn<() => Promise<number>>(() => Promise.resolve(1)),
    },
    tripParticipant: {
      findFirst: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findUnique: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findMany: vi.fn<() => Promise<unknown[]>>(() => Promise.resolve([])),
      create: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      update: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      upsert: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      delete: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      count: vi.fn<() => Promise<number>>(() => Promise.resolve(0)),
    },
    trip: {
      findFirst: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findUnique: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findMany: vi.fn<() => Promise<unknown[]>>(() => Promise.resolve([])),
      create: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      update: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      delete: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
    },
    group: {
      findFirst: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findUnique: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
      findMany: vi.fn<() => Promise<unknown[]>>(() => Promise.resolve([])),
      create: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      update: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
      delete: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
    },
    userAgent: {
      create: vi.fn<() => Promise<unknown>>(() => Promise.resolve({})),
    },
    $connect: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    $disconnect: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    $transaction: vi.fn<<T>(callback: (db: MockDbClient) => Promise<T>) => Promise<T>>((callback) =>
      callback(mockDb)
    ),
  };

  return createDrizzleProxy(mockDb) as unknown as MockDbClient;
}

export function createMockContext(overrides: Partial<TRPCContext> = {}): TRPCContext {
  const mockSupabase = createMockSupabase();
  const mockDb = createMockDb();

  return {
    db: mockDb as unknown as DB,
    supabase: mockSupabase as unknown as SupabaseClient,
    headers: new Headers(),
    accessToken: null,
    ...overrides,
  };
}

vi.mock("@mirai-app/supabase", () => {
  const mockSupabaseClient = createMockSupabase();
  const mockUser = createMockSupabaseUser();

  return {
    createClient: vi.fn(() => mockSupabaseClient),
    createBrowserClient: vi.fn(() => mockSupabaseClient),
    createServerClient: vi.fn(() => mockSupabaseClient),
    createMiddlewareClient: vi.fn(() => mockSupabaseClient),
    SupabaseProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
    useSupabase: vi.fn(() => mockSupabaseClient),
    createSupabaseClient: vi.fn(() => mockSupabaseClient),
  };
});

vi.mock("@mirai-app/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mirai-app/db")>();
  const mockDbClient = createMockDb();

  return {
    ...actual,
    createDb: vi.fn(() => mockDbClient),
  };
});

vi.mock("@mirai-app/auth", () => {
  const mockUser = createMockDbUser();
  const mockSupabaseUser = createMockSupabaseUser();

  return {
    requireAuth: vi.fn().mockResolvedValue({
      user: mockSupabaseUser,
      dbUser: mockUser,
    }),
    requireAdmin: vi.fn().mockResolvedValue({
      ...mockUser,
      role: "ADMIN",
    }),
    requireModerator: vi.fn().mockResolvedValue({
      ...mockUser,
      role: "MODERATOR",
    }),
    AuthenticationError: class AuthenticationError extends Error {
      constructor(message = "Not Authenticated") {
        super(message);
        this.name = "AuthenticationError";
      }
    },
    AuthorizationError: class AuthorizationError extends Error {
      constructor(message = "Missing Required Permissions") {
        super(message);
        this.name = "AuthorizationError";
      }
    },
  };
});

vi.mock("@mirai-app/shared", () => {
  return {
    STANDARD_BUCKETS: {
      IMAGES: 'images',
      VIDEOS: 'videos',
      PUBLIC: 'files-public'
    },
    normalizeStoragePath: vi.fn((path: string) => path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')),
    normalizeBucketName: vi.fn((bucket: string) => bucket?.toLowerCase()),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
