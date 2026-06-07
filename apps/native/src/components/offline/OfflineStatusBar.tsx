import { useOfflineQueueStore } from "~/stores/offlineQueueStore";
import { useNetworkStatus } from "~/hooks/offline/useNetworkStatus";
import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";

export function OfflineStatusBar() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { syncStatus, isProcessing } = useOfflineQueueStore();
  const translateY = useRef(new Animated.Value(-50)).current;

  const isVisible = !isConnected || isProcessing || syncStatus === "error";

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isVisible ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, translateY]);

  const getStatusText = () => {
    if (!isConnected) {
      return "Offline — some features may be limited";
    }
    if (!isInternetReachable) {
      return "No internet connection";
    }
    if (isProcessing) {
      return "Syncing...";
    }
    if (syncStatus === "error") {
      return "Sync failed — some changes couldn't be saved";
    }
    return "";
  };

  const getStatusColor = () => {
    if (!isConnected || !isInternetReachable) {
      return "bg-red-500";
    }
    if (isProcessing) {
      return "bg-blue-500";
    }
    if (syncStatus === "error") {
      return "bg-yellow-500";
    }
    return "bg-gray-500";
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <View className={`${getStatusColor()} px-4 py-2`}>
        <Text className="text-white text-center text-sm font-medium">{getStatusText()}</Text>
      </View>
    </Animated.View>
  );
}
