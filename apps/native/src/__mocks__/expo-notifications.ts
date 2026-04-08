// Mock for expo-notifications module
export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted", granted: true }),
);

export const setNotificationHandler = jest.fn();

export const scheduleNotificationAsync = jest.fn(() =>
  Promise.resolve("mock-notification-id"),
);

export const cancelScheduledNotificationAsync = jest.fn(() =>
  Promise.resolve(),
);

export const cancelAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve(),
);

export const getAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve([]),
);

export const setNotificationChannelAsync = jest.fn(() => Promise.resolve());

export const AndroidImportance = {
  DEFAULT: 5,
  HIGH: 6,
  LOW: 4,
  MAX: 7,
  MIN: 1,
  NONE: 0,
};

export const AndroidNotificationVisibility = {
  PRIVATE: 0,
  PUBLIC: 1,
  SECRET: 2,
};

// Mock for notification events
export const addNotificationReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

export const addNotificationResponseReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

export const removeNotificationSubscription = jest.fn();

export default {
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationHandler,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync,
  setNotificationChannelAsync,
  AndroidImportance,
  AndroidNotificationVisibility,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
};
