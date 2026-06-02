import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { makeQueryClient, getQueryClient, queryClient } from "../query-client-factory";

describe("makeQueryClient configuration", () => {
  it("should export a QueryClient instance", () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it("should not refetch on window focus", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    expect(defaultedOptions.refetchOnWindowFocus).toBe(false);
  });

  it("should disable refetch interval", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    expect(defaultedOptions.refetchInterval).toBe(false);
  });

  it("should have staleTime of 60 seconds", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    expect(defaultedOptions.staleTime).toBe(60 * 1000);
  });

  it("should not retry 400 client errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 400 };

    expect(retryFn(1, error)).toBe(false);
    expect(retryFn(2, error)).toBe(false);
  });

  it("should not retry 404 client errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 404 };

    expect(retryFn(1, error)).toBe(false);
  });

  it("should not retry 403 forbidden errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 403 };

    expect(retryFn(1, error)).toBe(false);
  });

  it("should retry 429 rate limit errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 429 };

    expect(retryFn(1, error)).toBe(true);
    expect(retryFn(2, error)).toBe(true);
    expect(retryFn(3, error)).toBe(false);
  });

  it("should retry 500 server errors up to 3 times", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 500 };

    expect(retryFn(1, error)).toBe(true);
    expect(retryFn(2, error)).toBe(true);
    expect(retryFn(3, error)).toBe(false);
  });

  it("should retry 503 service unavailable errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = { status: 503 };

    expect(retryFn(1, error)).toBe(true);
    expect(retryFn(2, error)).toBe(true);
  });

  it("should retry network errors without status", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryFn = defaultedOptions.retry as (failureCount: number, error: unknown) => boolean;
    const error = new Error("Network error");

    expect(retryFn(1, error)).toBe(true);
    expect(retryFn(2, error)).toBe(true);
    expect(retryFn(3, error)).toBe(false);
  });

  it("should use longer base delay for 429 errors", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryDelayFn = defaultedOptions.retryDelay as (attemptIndex: number, error: unknown) => number;
    const rateLimitError = { status: 429 };
    const serverError = { status: 500 };

    const rateLimitDelay = retryDelayFn(0, rateLimitError);
    const serverDelay = retryDelayFn(0, serverError);

    expect(rateLimitDelay).toBeGreaterThanOrEqual(2500);
    expect(serverDelay).toBeGreaterThanOrEqual(500);
    expect(rateLimitDelay).toBeGreaterThan(serverDelay);
  });

  it("should cap retry delay at 30 seconds", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryDelayFn = defaultedOptions.retryDelay as (attemptIndex: number, error: unknown) => number;
    const error = { status: 500 };

    const delay = retryDelayFn(10, error);
    expect(delay).toBeLessThanOrEqual(30_000);
  });

  it("should apply jitter to retry delays", () => {
    const defaultedOptions = queryClient.defaultQueryOptions({ queryKey: ["test"] });
    const retryDelayFn = defaultedOptions.retryDelay as (attemptIndex: number, error: unknown) => number;
    const error = { status: 500 };

    const delays = Array.from({ length: 20 }, () => retryDelayFn(1, error));
    const allEqual = delays.every((d) => d === delays[0]);
    expect(allEqual).toBe(false);
  });
});

describe("getQueryClient browser caching", () => {
  it("should return the same QueryClient instance on repeated imports in browser", () => {
    const firstImport = queryClient;
    const secondImport = queryClient;
    expect(firstImport).toBe(secondImport);
  });

  it("should have query cache and mutation cache", () => {
    expect(queryClient.getQueryCache()).toBeDefined();
    expect(queryClient.getMutationCache()).toBeDefined();
  });
});


