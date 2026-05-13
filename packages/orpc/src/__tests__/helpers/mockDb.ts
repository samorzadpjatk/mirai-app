/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { vi } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { DB } from "@mirai-app/db";
import * as schema from "@mirai-app/db/schema";

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

type Fn = ReturnType<typeof vi.fn>;

const createChainableProxy = (): any =>
  new Proxy(() => createChainableProxy(), {
    get: (_t, prop) =>
      prop === "then" || prop === "catch" || prop === "finally"
        ? undefined
        : createChainableProxy(),
    apply: () => createChainableProxy(),
  });

const createChainableMock = () => {
  const fn = vi.fn(() => createChainableProxy());
  return Object.assign(fn, createChainableProxy());
};

/* ------------------------------------------------------------------ */
/*  createMockDb                                                       */
/* ------------------------------------------------------------------ */

export const createMockDb = (): DB & {
  _queryMocks: Record<string, Record<string, Fn>>;
} => {
  const queryMocks: Record<string, Record<string, Fn>> = {};

  const getTableQuery = (tableName: string) => {
    if (!queryMocks[tableName]) {
      queryMocks[tableName] = {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findFirstOrThrow: vi.fn(),
        findUnique: vi.fn(),
      };
    }
    return queryMocks[tableName];
  };

  // Use Drizzle's built-in mock driver for proper typing
  const baseDb = drizzle.mock({ schema });

  // Override relational query methods for all schema tables
  for (const tableName of Object.keys(schema).filter((k) => k in baseDb.query)) {
    const queryEntry = baseDb.query[tableName as keyof typeof baseDb.query] as any;
    if (!queryEntry) continue;

    const mocks = getTableQuery(tableName);
    for (const method of ["findFirst", "findMany", "findFirstOrThrow", "findUnique"]) {
      if (typeof queryEntry[method] === "function") {
        queryEntry[method] = mocks[method];
      }
    }
  }

  const db: any = {
    ...baseDb,
    _queryMocks: queryMocks,

    insert: createChainableMock(),
    update: createChainableMock(),
    delete: createChainableMock(),
    select: createChainableMock(),

    transaction: vi.fn((cb: (tx: any) => Promise<unknown>) => {
      const tx = new Proxy(createChainableProxy(), {
        get: (_, prop) => {
          if (prop === "query") return new Proxy({}, { get: (_, p) => getTableQuery(String(p)) });
          if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
          if (prop === "insert") return db.insert;
          if (prop === "update") return db.update;
          if (prop === "delete") return db.delete;
          if (prop === "select") return db.select;
          return createChainableMock();
        },
      });
      return cb(tx);
    }),

    $client: {} as any,
    $schema: undefined,
    $count: vi.fn().mockResolvedValue(0),
  };
  return db;
};

/* ------------------------------------------------------------------ */
/*  High-level helpers                                                  */
/* ------------------------------------------------------------------ */

export const mockQuery = (
  db: ReturnType<typeof createMockDb>,
  table: string,
  method: "findFirst" | "findMany" | "findFirstOrThrow" | "findUnique",
): Fn => {
  if (!db._queryMocks[table]) db._queryMocks[table] = {};
  if (!db._queryMocks[table][method]) db._queryMocks[table][method] = vi.fn();
  return db._queryMocks[table][method];
};

export const mockInsertReturning = (
  db: ReturnType<typeof createMockDb>,
  value: unknown | unknown[],
) => {
  const returning = vi.fn().mockResolvedValue(Array.isArray(value) ? value : [value]);
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate, onConflictDoNothing, returning }));
  db.insert.mockReturnValue({ values });
  return { values, onConflictDoUpdate, onConflictDoNothing, returning };
};

export const mockUpdateReturning = (
  db: ReturnType<typeof createMockDb>,
  value: unknown | unknown[],
) => {
  const returning = vi.fn().mockResolvedValue(Array.isArray(value) ? value : [value]);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  db.update.mockReturnValue({ set });
  return { set, where, returning };
};

export const mockDeleteReturning = (
  db: ReturnType<typeof createMockDb>,
  value: unknown | unknown[],
) => {
  const returning = vi.fn().mockResolvedValue(Array.isArray(value) ? value : [value]);
  const where = vi.fn(() => ({ returning }));
  db.delete.mockReturnValue({ where });
  return { where, returning };
};

const makeThenable = (target: any, value: any) => {
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve(value);
      }
      if (prop === "catch") {
        return () => {};
      }
      if (prop === "finally") {
        return () => {};
      }
      const val = t[prop];
      return typeof val === "function" ? val.bind(t) : val;
    },
  });
};

export const mockSelect = (db: ReturnType<typeof createMockDb>, value: unknown[]) => {
  const limit = vi.fn(() => makeThenable({}, value));
  const orderBy = vi.fn(() => makeThenable({ limit }, value));
  const groupBy = vi.fn(() => makeThenable({ orderBy, limit }, value));
  const where = vi.fn(() =>
    makeThenable(
      {
        groupBy,
        limit,
        orderBy,
        leftJoin: vi.fn(() => makeThenable({ where }, value)),
        innerJoin: vi.fn(() => makeThenable({ where }, value)),
      },
      value,
    ),
  );
  const from = vi.fn(() =>
    makeThenable(
      {
        where,
        innerJoin: vi.fn(() => makeThenable({ where }, value)),
        leftJoin: vi.fn(() => makeThenable({ where }, value)),
      },
      value,
    ),
  );
  db.select.mockReturnValue(makeThenable({ from }, value));
  return {
    from,
    where,
    innerJoin: vi.fn(() => makeThenable({ where }, value)),
    leftJoin: vi.fn(() => makeThenable({ where }, value)),
    groupBy,
    orderBy,
    limit,
  };
};

export const mockSelectOnce = (db: ReturnType<typeof createMockDb>, value: unknown[]) => {
  const limit = vi.fn(() => makeThenable({}, value));
  const orderBy = vi.fn(() => makeThenable({ limit }, value));
  const groupBy = vi.fn(() => makeThenable({ orderBy, limit }, value));
  const where = vi.fn(() =>
    makeThenable(
      {
        groupBy,
        limit,
        orderBy,
        leftJoin: vi.fn(() => makeThenable({ where }, value)),
        innerJoin: vi.fn(() => makeThenable({ where }, value)),
      },
      value,
    ),
  );
  const from = vi.fn(() =>
    makeThenable(
      {
        where,
        innerJoin: vi.fn(() => makeThenable({ where }, value)),
        leftJoin: vi.fn(() => makeThenable({ where }, value)),
      },
      value,
    ),
  );
  db.select.mockReturnValueOnce(makeThenable({ from }, value));
  return {
    from,
    where,
    innerJoin: vi.fn(() => makeThenable({ where }, value)),
    leftJoin: vi.fn(() => makeThenable({ where }, value)),
    groupBy,
    orderBy,
    limit,
  };
};

export const mockSelectOne = (db: ReturnType<typeof createMockDb>, value: unknown) => {
  const orderBy = vi.fn().mockResolvedValue(value);
  const makeThenableLocal = (obj: Record<string, unknown>) => {
    (obj as any).then = (resolve: (v: unknown) => unknown) => resolve(value);
    return obj;
  };
  const limit = vi.fn(() => makeThenableLocal({ orderBy }));
  const where = vi.fn(() => makeThenableLocal({ limit }));
  const from = vi.fn(() => makeThenableLocal({ where }));
  db.select.mockReturnValue({ from });
  return { from, where };
};

export const mockFindFirst = (db: ReturnType<typeof createMockDb>, table: string, value: unknown) =>
  mockQuery(db, table, "findFirst").mockResolvedValue(value);

export const mockFindMany = (
  db: ReturnType<typeof createMockDb>,
  table: string,
  values: unknown[],
) => mockQuery(db, table, "findMany").mockResolvedValue(values);

export const mockTransaction = (
  db: ReturnType<typeof createMockDb>,
  fn: (tx: any) => Promise<unknown>,
) => db.transaction.mockImplementation((cb: any) => cb(db));
