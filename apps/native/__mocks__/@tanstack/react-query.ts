import { jest } from "@jest/globals";
import React from "react";

export const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export class QueryClient {
  defaultOptions: unknown;

  constructor(options?: unknown) {
    this.defaultOptions = options ?? {};
  }
}

export const useQuery = jest.fn();
export const useMutation = jest.fn();
export const useInfiniteQuery = jest.fn();
export const useQueryClient = jest.fn();

useQuery.mockReturnValue({
  data: null,
  isLoading: false,
  isRefetching: false,
  refetch: jest.fn(),
});

useMutation.mockReturnValue({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
});

useInfiniteQuery.mockReturnValue({
  data: null,
  isLoading: false,
  isRefetching: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn(),
});

useQueryClient.mockReturnValue({
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn(),
  removeQueries: jest.fn(),
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
});
