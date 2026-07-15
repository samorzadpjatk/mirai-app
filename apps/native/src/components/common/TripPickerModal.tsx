import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { TripListItem } from "~/components/trips/list/types";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import { borderRadius, colors, spacing, typography } from "../../styles";

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
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
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
      transparent={true}
      onRequestClose={onClose}
      testID="trip-picker-modal"
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select trip</Text>
            <TouchableOpacity onPress={onClose} testID="close-button">
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalList}
            onScroll={onLoadMore}
            scrollEventThrottle={16}
            testID="trip-list-scrollview"
          >
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.modalItem}
                onPress={() => handleSelectTrip(trip.id)}
                testID={`trip-item-${trip.id}`}
              >
                <Text style={styles.modalItemText}>{trip.name}</Text>
                {selectedTripId === trip.id ? (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={palette.primary}
                    testID="checkmark-icon"
                  />
                ) : null}
              </TouchableOpacity>
            ))}

            {trips.length === 0 && !isLoading ? (
              <Text style={styles.modalEmpty}>No trips available</Text>
            ) : null}

            {isFetchingMore ? (
              <View style={styles.modalFooterLoader}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={styles.modalFooterLoaderText}>Loading more trips...</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.blackOpacity40,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: palette.borderDark,
      maxHeight: "70%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    modalTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
    },
    modalList: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderWhite5,
    },
    modalItemText: {
      color: colors.white,
      fontSize: typography.base,
      flex: 1,
      paddingRight: spacing.sm,
    },
    modalEmpty: {
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
    modalFooterLoader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    modalFooterLoaderText: {
      color: colors.textSecondary,
      fontSize: typography.sm,
    },
  });
}
