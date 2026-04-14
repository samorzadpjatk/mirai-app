import React, { useCallback } from "react";
import { ActivityIndicator, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";
import type { TripListItem } from "~/components/trips/list/types";

interface TripPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTrip: (tripId: string) => void;
  trips: TripListItem[];
  selectedTripId?: string | null;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => void;
}

export function TripPickerModal({
  visible,
  onClose,
  onSelectTrip,
  trips,
  selectedTripId,
  isLoading = false,
  isFetchingMore = false,
  onLoadMore,
}: TripPickerModalProps) {
  const handleSelectTrip = useCallback(
    (tripId: string) => {
      onSelectTrip(tripId);
      onClose();
    },
    [onSelectTrip, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <YStack
        flex={1}
        backgroundColor="$blackOpacity40"
        justifyContent="center"
        paddingHorizontal="$lg"
      >
        <YStack
          backgroundColor="$cardDark"
          borderRadius="$lg"
          borderWidth={1}
          borderColor="$borderDark"
          maxHeight="70%"
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$lg"
            paddingTop="$lg"
            paddingBottom="$md"
          >
            <Text fontSize="$lg" fontWeight="700" color="$white">
              Select trip
            </Text>
            <Button onPress={onClose} chromeless padding="$sm">
              <Ionicons name="close" size={18} color="#9ca3af" />
            </Button>
          </XStack>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              gap: 12,
            }}
            onScroll={onLoadMore}
            scrollEventThrottle={16}
          >
            {trips.map((trip) => (
              <Button
                key={trip.id}
                onPress={() => handleSelectTrip(trip.id)}
                chromeless
                paddingVertical="$md"
                paddingHorizontal="$md"
              >
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                  borderBottomWidth={1}
                  borderBottomColor="rgba(255,255,255,0.05)"
                >
                  <Text
                    color="$white"
                    fontSize="$base"
                    flex={1}
                    paddingRight="$sm"
                  >
                    {trip.name}
                  </Text>
                  {selectedTripId === trip.id ? (
                    <Ionicons name="checkmark" size={18} color="#00ced1" />
                  ) : null}
                </XStack>
              </Button>
            ))}

            {trips.length === 0 && !isLoading ? (
              <Text
                color="$textSecondary"
                textAlign="center"
                paddingVertical="$lg"
              >
                No trips available
              </Text>
            ) : null}

            {isFetchingMore ? (
              <XStack
                alignItems="center"
                justifyContent="center"
                gap="$sm"
                paddingVertical="$sm"
              >
                <ActivityIndicator size="small" color="#00ced1" />
                <Text color="$textSecondary" fontSize="$sm">
                  Loading more trips...
                </Text>
              </XStack>
            ) : null}
          </ScrollView>
        </YStack>
      </YStack>
    </Modal>
  );
}
