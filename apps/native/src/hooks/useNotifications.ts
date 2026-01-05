export function useNotifications() {
  return {
    isSupported: false,
    isSubscribed: false,
    isSubscribedElsewhere: false,
    isLoading: false,
    permission: "default",
    requestPermission: () => Promise.resolve(),
    subscribe: () => Promise.resolve(),
    unsubscribe: () => Promise.resolve(),
    testNotification: () => Promise.resolve(),
  };
}
