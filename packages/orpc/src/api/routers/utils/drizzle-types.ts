import type { DB } from "@mirai-app/db";

type ExtractCallback<T> = T extends (...args: infer A) => infer R ? (...args: A) => R : never;

export type WhereCallback<TTable extends keyof DB["query"]> = ExtractCallback<
  NonNullable<Parameters<DB["query"][TTable]["findMany"]>[0]>["where"]
>;

export type OrderByCallback<TTable extends keyof DB["query"]> = ExtractCallback<
  NonNullable<Parameters<DB["query"][TTable]["findMany"]>[0]>["orderBy"]
>;
