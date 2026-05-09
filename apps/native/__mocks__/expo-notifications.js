const mockGetExpoPushTokenAsync = jest.fn(() => Promise.resolve({ data: "mock-push-token" }));
const mockGetPermissionsAsync = jest.fn(() => Promise.resolve({ status: "granted" }));
const mockRequestPermissionsAsync = jest.fn(() => Promise.resolve({ status: "granted" }));
const mockSetNotificationChannelAsync = jest.fn(() => Promise.resolve(undefined));
const mockGetNotificationChannelsAsync = jest.fn(() => Promise.resolve([]));
const mockScheduleNotificationAsync = jest.fn(() => Promise.resolve("notification-id"));
const mockCancelScheduledNotificationAsync = jest.fn(() => Promise.resolve(undefined));
const mockGetAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([]));
const mockDismissNotificationAsync = jest.fn(() => Promise.resolve(undefined));
const mockSetBadgeCountAsync = jest.fn(() => Promise.resolve(undefined));
const mockGetBadgeCountAsync = jest.fn(() => Promise.resolve(0));
const mockAddNotificationReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
const mockAddNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
const mockRemoveNotificationSubscription = jest.fn();

export const getExpoPushTokenAsync = mockGetExpoPushTokenAsync;
export const getPermissionsAsync = mockGetPermissionsAsync;
export const requestPermissionsAsync = mockRequestPermissionsAsync;
export const setNotificationChannelAsync = mockSetNotificationChannelAsync;
export const getNotificationChannelsAsync = mockGetNotificationChannelsAsync;
export const scheduleNotificationAsync = mockScheduleNotificationAsync;
export const cancelScheduledNotificationAsync = mockCancelScheduledNotificationAsync;
export const getAllScheduledNotificationsAsync = mockGetAllScheduledNotificationsAsync;
export const dismissNotificationAsync = mockDismissNotificationAsync;
export const setBadgeCountAsync = mockSetBadgeCountAsync;
export const getBadgeCountAsync = mockGetBadgeCountAsync;
export const addNotificationReceivedListener = mockAddNotificationReceivedListener;
export const addNotificationResponseReceivedListener = mockAddNotificationResponseReceivedListener;
export const removeNotificationSubscription = mockRemoveNotificationSubscription;
const defaultExport = {
  getExpoPushTokenAsync: mockGetExpoPushTokenAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  addNotificationReceivedListener: mockAddNotificationReceivedListener,
  addNotificationResponseReceivedListener: mockAddNotificationResponseReceivedListener,
  removeNotificationSubscription: mockRemoveNotificationSubscription,
};

export default defaultExport;
