import { vi, type Mocked } from "vitest";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import type { DB, User } from "@mirai-app/db";
import type { TRPCContext } from "./src/api/trpc";

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
  getUserById: MockedFunction<
    (id: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>
  >;
  listUsers: MockedFunction<() => Promise<{ data: { users: SupabaseUser[] }; error: null }>>;
  createUser: MockedFunction<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>;
  updateUserById: MockedFunction<
    () => Promise<{ data: { user: SupabaseUser | null }; error: null }>
  >;
  deleteUser: MockedFunction<() => Promise<{ data: Record<string, never>; error: null }>>;
}

interface MockSupabaseAuth {
  getSession: MockedFunction<() => Promise<{ data: { session: null }; error: null }>>;
  getUser: MockedFunction<
    (token?: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>
  >;
  signInWithOtp: MockedFunction<() => Promise<{ data: Record<string, never>; error: null }>>;
  signInWithPassword: MockedFunction<
    () => Promise<{
      data: { user: SupabaseUser | null; session: { access_token: string } | null };
      error: null;
    }>
  >;
  signOut: MockedFunction<() => Promise<{ error: null }>>;
  verifyOtp: MockedFunction<
    () => Promise<{
      data: { user: SupabaseUser | null; session: { access_token: string } | null };
      error: null;
    }>
  >;
  onAuthStateChange: MockedFunction<
    () => { data: { subscription: { unsubscribe: MockedFunction<() => void> } } }
  >;
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
      Promise.resolve({ data: null, error: null }),
    ),
  };
  return builder;
}

function createMockAuthAdmin(): MockSupabaseAuthAdmin {
  const mockUser = createMockSupabaseUser();
  return {
    getUserById: vi.fn<
      (id: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>
    >(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    listUsers: vi.fn<() => Promise<{ data: { users: SupabaseUser[] }; error: null }>>(() =>
      Promise.resolve({ data: { users: [mockUser] }, error: null }),
    ),
    createUser: vi.fn<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null }),
    ),
    updateUserById: vi.fn<() => Promise<{ data: { user: SupabaseUser | null }; error: null }>>(() =>
      Promise.resolve({ data: { user: mockUser }, error: null }),
    ),
    deleteUser: vi.fn<() => Promise<{ data: Record<string, never>; error: null }>>(() =>
      Promise.resolve({ data: {}, error: null }),
    ),
  };
}

function createMockAuth(): MockSupabaseAuth {
  const mockUser = createMockSupabaseUser();
  return {
    getSession: vi.fn<() => Promise<{ data: { session: null }; error: null }>>(() =>
      Promise.resolve({ data: { session: null }, error: null }),
    ),
    getUser: vi.fn<
      (token?: string) => Promise<{ data: { user: SupabaseUser | null }; error: null }>
    >(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    signInWithOtp: vi.fn<() => Promise<{ data: Record<string, never>; error: null }>>(() =>
      Promise.resolve({ data: {}, error: null }),
    ),
    signInWithPassword: vi.fn<
      () => Promise<{
        data: { user: SupabaseUser | null; session: { access_token: string } | null };
        error: null;
      }>
    >(() =>
      Promise.resolve({
        data: { user: mockUser, session: { access_token: "test-token" } },
        error: null,
      }),
    ),
    signOut: vi.fn<() => Promise<{ error: null }>>(() => Promise.resolve({ error: null })),
    verifyOtp: vi.fn<
      () => Promise<{
        data: { user: SupabaseUser | null; session: { access_token: string } | null };
        error: null;
      }>
    >(() =>
      Promise.resolve({
        data: { user: mockUser, session: { access_token: "test-token" } },
        error: null,
      }),
    ),
    onAuthStateChange: vi.fn<
      () => { data: { subscription: { unsubscribe: MockedFunction<() => void> } } }
    >(() => ({
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
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (
    name.endsWith("ches") ||
    name.endsWith("shes") ||
    name.endsWith("xes") ||
    name.endsWith("zes")
  )
    return name.slice(0, -2);
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function getTableNameFromModel(modelName: string): string {
  if (modelName === "tripParticipant") return "trip_participants";
  if (modelName === "user") return "users";
  if (modelName === "group") return "groups";
  if (modelName === "challenge") return "challenges";
  if (modelName === "challengeSubmission") return "challenge_submissions";
  if (modelName === "challengeVote") return "challenge_votes";
  if (modelName === "reward") return "rewards";
  if (modelName === "rewardPurchase") return "reward_purchases";
  if (modelName === "trip") return "trips";
  if (modelName === "tripGroup") return "trip_groups";
  if (modelName === "tripResource") return "trip_resources";
  if (modelName === "tripInsurance") return "trip_insurances";
  if (modelName === "tripSponsor") return "trip_sponsors";
  if (modelName === "notification") return "notifications";
  if (modelName === "notificationSchedule") return "notification_schedules";
  if (modelName === "notificationPush") return "notification_pushes";
  if (modelName === "coinTransaction") return "coin_transactions";
  if (modelName === "location") return "locations";
  if (modelName === "sponsor") return "sponsors";
  if (modelName === "submissionReport") return "submission_reports";
  if (modelName === "activityFeed") return "activity_feeds";
  if (modelName === "storage") return "storages";
  return toSnakeCase(modelName) + "s";
}

function getTableName(table: unknown): string | undefined {
  if (typeof table === "string") return table;
  if (table && typeof table === "object") {
    const obj = table as Record<string | symbol, unknown>;
    if (obj.name && typeof obj.name === "string") {
      return obj.name;
    }
    const sym = Object.getOwnPropertySymbols(obj).find((s) => s.description === "drizzle:Name");
    if (sym && typeof obj[sym] === "string") {
      return obj[sym] as string;
    }
  }
  return undefined;
}

function getModelName(table: unknown): string {
  const name = getTableName(table);
  return toCamelCase(singularize(name ?? "unknown"));
}

function syncFindFirstWithFindUnique(model: Record<string, unknown>): void {
  if (!model || typeof model !== "object") return;

  const findFirst = model.findFirst;
  const findUnique = model.findUnique;

  if (typeof findFirst === "function" && !findUnique) {
    const findFirstFn = findFirst as (...args: unknown[]) => Promise<unknown>;
    model.findUnique = vi.fn().mockImplementation((...args: unknown[]) => findFirstFn(...args));
  } else if (typeof findUnique === "function" && !findFirst) {
    const findUniqueFn = findUnique as (...args: unknown[]) => Promise<unknown>;
    model.findFirst = vi.fn().mockImplementation((...args: unknown[]) => findUniqueFn(...args));
  }
}

export function addDrizzleApi(mockDb: Record<string, unknown>): void {
  for (const key of Object.keys(mockDb)) {
    const value = mockDb[key];
    if (
      value &&
      typeof value === "object" &&
      ("findFirst" in value || "findUnique" in value || "findMany" in value)
    ) {
      syncFindFirstWithFindUnique(value as Record<string, unknown>);
    }
  }

  if (!mockDb.query) {
    mockDb.query = new Proxy(
      {},
      {
        get(_, tableName) {
          const singular = toCamelCase(singularize(String(tableName)));
          const model = mockDb[singular];
          const defaults: Record<string, (...args: unknown[]) => Promise<unknown>> = {
            findFirst: () => Promise.resolve(null),
            findUnique: () => Promise.resolve(null),
            findMany: () => Promise.resolve([]),
            count: () => Promise.resolve(0),
          };
          if (model && typeof model === "object") {
            const modelObj = model as Record<string, unknown>;
            return new Proxy(model as object, {
              get(target, prop) {
                const val = (target as Record<string | symbol, unknown>)[prop];
                if (typeof val === "function") {
                  return async (...args: unknown[]) => {
                    const result = await (val as (...args: unknown[]) => unknown)(...args);
                    if (String(prop) === "findFirst" && (result === null || result === undefined)) {
                      const findUniqueVal = modelObj.findUnique;
                      if (typeof findUniqueVal === "function") {
                        return await (findUniqueVal as (...args: unknown[]) => unknown)(...args);
                      }
                    }
                    return result;
                  };
                }
                if (typeof val === "undefined" && typeof prop === "string" && prop in defaults) {
                  const fallbackProp =
                    prop === "findFirst" && "findUnique" in modelObj ? "findUnique" : prop;
                  const fallbackVal = modelObj[fallbackProp];
                  if (typeof fallbackVal === "function") {
                    return (...args: unknown[]) =>
                      (fallbackVal as (...args: unknown[]) => unknown)(...args);
                  }
                  return (...args: unknown[]) => defaults[prop](...args);
                }
                return val;
              },
            });
          }
          return {
            findFirst: vi.fn(() => Promise.resolve(null)),
            findUnique: vi.fn(() => Promise.resolve(null)),
            findMany: vi.fn(() => Promise.resolve([])),
            count: vi.fn(() => Promise.resolve(0)),
          };
        },
      },
    );
  }

  if (!mockDb.insert) {
    mockDb.insert = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        values: vi.fn((data: unknown) => {
          const model = mockDb[modelName];
          const returningChainable = (value: unknown) => ({
            returning: vi.fn(() => Promise.resolve([value])),
          });
          if (model && typeof model === "object" && "create" in model) {
            const createFn = (model as Record<string, unknown>).create as (
              ...args: unknown[]
            ) => Promise<unknown>;
            const resultPromise = Promise.resolve(createFn({ data }));
            return {
              returning: vi.fn(async () => Promise.resolve([await resultPromise])),
              onConflictDoNothing: vi.fn(() => ({
                returning: vi.fn(async () => Promise.resolve([await resultPromise])),
              })),
              onConflictDoUpdate: vi.fn(() => ({
                returning: vi.fn(async () => Promise.resolve([await resultPromise])),
              })),
            };
          }
          return {
            returning: vi.fn(() => Promise.resolve([data])),
            onConflictDoNothing: vi.fn(() => returningChainable(data)),
            onConflictDoUpdate: vi.fn(() => returningChainable(data)),
          };
        }),
      };
    });
  }

  if (!mockDb.update) {
    mockDb.update = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        set: vi.fn((data: unknown) => ({
          where: vi.fn(() => {
            const model = mockDb[modelName];
            if (model && typeof model === "object" && "update" in model) {
              const updateFn = (model as Record<string, unknown>).update as (
                ...args: unknown[]
              ) => Promise<unknown>;
              const result = updateFn({ data });
              const resolvedResult = result instanceof Promise ? result : Promise.resolve(result);
              return {
                returning: vi.fn(async () => Promise.resolve([await resolvedResult])),
              };
            }
            return {
              returning: vi.fn(() => Promise.resolve([data])),
            };
          }),
        })),
      };
    });
  }

  if (!mockDb.delete) {
    mockDb.delete = vi.fn((table: unknown) => {
      const modelName = getModelName(table);
      return {
        where: vi.fn(() => {
          const model = mockDb[modelName];
          if (model && typeof model === "object" && "delete" in model) {
            const deleteFn = (model as Record<string, unknown>).delete as (
              ...args: unknown[]
            ) => Promise<unknown>;
            const result = deleteFn();
            const resolvedResult = result instanceof Promise ? result : Promise.resolve(result);
            return {
              returning: vi.fn(async () => Promise.resolve([await resolvedResult])),
            };
          }
          return {
            returning: vi.fn(() => Promise.resolve([{}])),
          };
        }),
      };
    });
  }

  if (!mockDb.select) {
    const createSelectChainable = (fields?: unknown) => {
      let primaryTable: string | undefined;
      let hasGroupBy = false;
      const joins: { table: string; alias: string; isLeft: boolean }[] = [];

      const addJoin = (table: unknown, isLeft: boolean) => {
        const name = getTableName(table);
        if (name) {
          const alias = toCamelCase(singularize(name));
          joins.push({ table: name, alias, isLeft });
        }
        return builder;
      };

      const builder: Record<string, unknown> = {
        from: vi.fn((table: unknown) => {
          const name = getTableName(table);
          if (name) {
            primaryTable = toCamelCase(singularize(name));
          }
          return builder;
        }),
        innerJoin: vi.fn((table: unknown) => addJoin(table, false)),
        leftJoin: vi.fn((table: unknown) => addJoin(table, true)),
        where: vi.fn(() => builder),
        orderBy: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        offset: vi.fn(() => builder),
        groupBy: vi.fn(() => {
          hasGroupBy = true;
          return builder;
        }),
        having: vi.fn(() => builder),
        then: vi.fn((resolve: (value: unknown) => unknown) => {
          if (primaryTable) {
            const model = mockDb[primaryTable];
            if (model && typeof model === "object") {
              const fieldNames =
                fields && typeof fields === "object"
                  ? Object.keys(fields as Record<string, unknown>)
                  : [];
              const hasCountOnly = fieldNames.length === 1 && fieldNames[0] === "count";
              if (hasCountOnly && "count" in model) {
                return (model as { count: () => Promise<number> })
                  .count()
                  .then((count: number) => resolve([{ count }]));
              }
              if (hasGroupBy && "groupBy" in model) {
                return (model as { groupBy: () => Promise<Record<string, unknown>[]> })
                  .groupBy()
                  .then((groups) => {
                    const mapped = groups.map((row) => {
                      const item: Record<string, unknown> = {};
                      for (const field of fieldNames) {
                        if (field in row) item[field] = row[field];
                        else if (field === "count" && row._count) {
                          item.count =
                            (row._count as Record<string, unknown>).id ??
                            (row._count as Record<string, unknown>).all ??
                            0;
                        }
                      }
                      return item;
                    });
                    return resolve(mapped);
                  });
              }
              if ("findMany" in model) {
                return (model as { findMany: () => Promise<unknown[]> })
                  .findMany()
                  .then((rows: unknown[]) => {
                    if (!joins.length) return resolve(rows);

                    const primaryAlias = getTableNameFromModel(primaryTable!);
                    const mapped = rows.map((row) => {
                      const mappedRow: Record<string, unknown> = {};
                      mappedRow[primaryAlias] = row;

                      for (const join of joins) {
                        const joinModel = mockDb[join.alias];
                        let joinData: unknown = null;
                        if (join.alias === "user" && row && typeof row === "object") {
                          joinData = (row as Record<string, unknown>).user ?? null;
                        } else if (join.alias === "group" && row && typeof row === "object") {
                          joinData = (row as Record<string, unknown>).group ?? null;
                        }
                        mappedRow[join.table] = joinData;
                      }

                      if (row && typeof row === "object") {
                        for (const field of fieldNames) {
                          if (field in (row as Record<string, unknown>)) {
                            mappedRow[field] = (row as Record<string, unknown>)[field];
                          }
                        }
                      }
                      return mappedRow;
                    });
                    return resolve(mapped);
                  });
              }
            }
          }
          return Promise.resolve([]).then(resolve);
        }),
      };
      return builder;
    };

    mockDb.select = vi.fn((fields?: unknown) => createSelectChainable(fields));
  }

  if (typeof mockDb.transaction !== "function") {
    mockDb.transaction = vi.fn((callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const tx = { ...mockDb };
      addDrizzleApi(tx);
      return callback(tx);
    });
  }
}

export function createMockDb(): MockDbClient & Record<string, unknown> {
  const mockUser = createMockDbUser();

  const mockDb: MockDbClient & Record<string, unknown> = {
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
      callback(mockDb),
    ),
  };

  addDrizzleApi(mockDb);
  return mockDb;
}

export function createMockContext(overrides: Partial<TRPCContext> = {}): TRPCContext {
  const mockSupabase = createMockSupabase();
  const mockDb = createMockDb();

  return {
    db: mockDb as DB,
    supabase: mockSupabase,
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

vi.mock("@mirai-app/db", async () => {
  const actual = await vi.importActual<typeof import("@mirai-app/db")>("@mirai-app/db");
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
      IMAGES: "images",
      VIDEOS: "videos",
      PUBLIC: "files-public",
    },
    normalizeStoragePath: vi.fn((path: string) =>
      path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, ""),
    ),
    normalizeBucketName: vi.fn((bucket: string) => bucket?.toLowerCase()),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
