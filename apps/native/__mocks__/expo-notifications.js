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

module.exports = {
  getExpoPushTokenAsync: mockGetExpoPushTokenAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  setNotificationChannelAsync: mockSetNotificationChannelAsync,
  getNotificationChannelsAsync: mockGetNotificationChannelsAsync,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync: mockGetAllScheduledNotificationsAsync,
  dismissNotificationAsync: mockDismissNotificationAsync,
  setBadgeCountAsync: mockSetBadgeCountAsync,
  getBadgeCountAsync: mockGetBadgeCountAsync,
  addNotificationReceivedListener: mockAddNotificationReceivedListener,
  addNotificationResponseReceivedListener: mockAddNotificationResponseReceivedListener,
  removeNotificationSubscription: mockRemoveNotificationSubscription,
  default: {
    getExpoPushTokenAsync: mockGetExpoPushTokenAsync,
    getPermissionsAsync: mockGetPermissionsAsync,
    requestPermissionsAsync: mockRequestPermissionsAsync,
    addNotificationReceivedListener: mockAddNotificationReceivedListener,
    addNotificationResponseReceivedListener: mockAddNotificationResponseReceivedListener,
    removeNotificationSubscription: mockRemoveNotificationSubscription,
  },
};
