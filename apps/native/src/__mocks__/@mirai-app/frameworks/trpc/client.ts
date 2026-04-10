// Mock for @mirai-app/frameworks/trpc/client
import { jest } from "@jest/globals";

// Create mock tRPC client with all expected procedures
const createMockTRPCClient = () => ({
  group: {
    getAll: {
      query: jest.fn(() =>
        Promise.resolve({
          data: [],
          nextCursor: null,
        }),
      ),
    },
    getById: {
      query: jest.fn(() => Promise.resolve({ id: "1", name: "Test Group" })),
    },
    create: {
      mutate: jest.fn(() => Promise.resolve({ id: "new-group-id" })),
    },
    update: {
      mutate: jest.fn(() => Promise.resolve({ success: true })),
    },
  },
  trip: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
    getById: {
      query: jest.fn(() => Promise.resolve({ id: "1", name: "Test Trip" })),
    },
    getResources: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  challenge: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
    getById: {
      query: jest.fn(() =>
        Promise.resolve({ id: "1", name: "Test Challenge" }),
      ),
    },
    submit: {
      mutate: jest.fn(() => Promise.resolve({ success: true })),
    },
  },
  notification: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
    markAsRead: {
      mutate: jest.fn(() => Promise.resolve({ success: true })),
    },
  },
  notificationSender: {
    trackDeliveryStart: {
      mutate: jest.fn(() => Promise.resolve()),
    },
    sendMobileNotifications: {
      mutate: jest.fn(() =>
        Promise.resolve({ total: 1, sent: 1, failed: 0, success: true }),
      ),
    },
    trackDeliveryComplete: {
      mutate: jest.fn(() => Promise.resolve()),
    },
    trackDeliveryFailure: {
      mutate: jest.fn(() => Promise.resolve()),
    },
  },
  user: {
    me: {
      query: jest.fn(() =>
        Promise.resolve({ id: "1", email: "test@example.com" }),
      ),
    },
  },
  location: {
    update: {
      mutate: jest.fn(() => Promise.resolve({ success: true })),
    },
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  sponsor: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  partner: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  reward: {
    getAll: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  admin: {
    getChallengesByTrip: {
      query: jest.fn(() => Promise.resolve([])),
    },
  },
  judgement: {
    getSubmissions: {
      query: jest.fn(() => Promise.resolve([])),
    },
    vote: {
      mutate: jest.fn(() => Promise.resolve({ success: true })),
    },
  },
  upload: {
    createTusUpload: {
      mutate: jest.fn(() =>
        Promise.resolve({ uploadUrl: "https://mock-upload-url.com" }),
      ),
    },
  },
});

// Mock getTRPCClient
export const getTRPCClient = jest.fn(
  (httpUrl: string, wsUrl: string, token: string) => ({
    client: createMockTRPCClient(),
    cleanup: jest.fn(() => Promise.resolve()),
  }),
);

// Mock useTRPC hook
export const useTRPC = jest.fn(() => createMockTRPCClient());

// Mock useTRPCClient hook
export const useTRPCClient = jest.fn(() => createMockTRPCClient());

// Mock tRPC provider (no-op in tests)
export const TRPCProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

// Default export
export default {
  getTRPCClient,
  useTRPC,
  useTRPCClient,
  TRPCProvider,
};
