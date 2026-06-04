import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import FullscreenSubmissionSlide, { formatDateTime } from "./FullscreenSubmissionSlide";
import SubmissionCircle from "./SubmissionCircle";

export { formatDateTime };

export interface ApprovedSubmissionItem {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  imageStoragePath: string;
  approvedAt: string | Date;
}

interface GroupApprovedChallengesProps {
  submissions: ApprovedSubmissionItem[];
}

import {
  calculateBoundedIndex,
  calculateNextIndexFromScroll,
  canOpenFullscreen,
  needsFullscreenClose,
} from "./groupApprovedChallengesUtils";

export {
  calculateNextIndexFromScroll,
  calculateBoundedIndex,
  canOpenFullscreen,
  needsFullscreenClose,
};

export function GroupApprovedChallenges({ submissions }: GroupApprovedChallengesProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<ApprovedSubmissionItem>>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openFullscreen = useCallback(
    (index: number) => {
      if (!canOpenFullscreen(submissions.length)) return;
      setActiveIndex(index);
      setIsFullscreenOpen(true);
    },
    [submissions.length],
  );

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
  }, []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = calculateNextIndexFromScroll(offsetX, width);
      const boundedIndex = calculateBoundedIndex(nextIndex, submissions.length - 1);
      setActiveIndex(boundedIndex);
    },
    [submissions.length, width],
  );

  useEffect(() => {
    if (needsFullscreenClose(submissions.length)) {
      setTimeout(() => setIsFullscreenOpen(false), 0);
      return;
    }
    if (!isFullscreenOpen) return;
    const boundedIndex = calculateBoundedIndex(activeIndex, submissions.length - 1);
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: boundedIndex, animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreenOpen, activeIndex, submissions.length]);

  if (!canOpenFullscreen(submissions.length)) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Challenge Photos</Text>
        <TouchableOpacity
          testID="view-all-button"
          style={styles.showAllButton}
          onPress={() => openFullscreen(0)}
          activeOpacity={0.8}
        >
          <Text style={styles.showAllButtonText}>View all</Text>
          <Ionicons name="expand-outline" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {submissions.map((submission, index) => (
          <SubmissionCircle
            key={submission.submissionId}
            submission={submission}
            onPress={() => openFullscreen(index)}
          />
        ))}
      </View>

      <Modal
        visible={isFullscreenOpen}
        animationType="slide"
        onRequestClose={closeFullscreen}
        presentationStyle="fullScreen"
      >
        <View style={styles.fullscreen}>
          <View style={[styles.fullscreenHeader, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.fullscreenTitle}>Challenge Photos</Text>
            <View style={styles.fullscreenHeaderRight}>
              <Text style={styles.fullscreenCounter}>
                {`${activeIndex + 1}/${submissions.length}`}
              </Text>
              <TouchableOpacity
                testID="fullscreen-close-button"
                style={styles.fullscreenClose}
                onPress={closeFullscreen}
              >
                <Ionicons name="close" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ListEmptyComponent not needed: this modal is guarded by the outer conditional
              `if (!canOpenFullscreen(submissions.length)) return null;` which ensures
              the FlatList only renders when there are submissions to display. */}
          <FlatList
            testID="fullscreen-flatlist"
            ref={listRef}
            data={submissions}
            keyExtractor={(item) => item.submissionId}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
            horizontal={true}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(
                0,
                Math.min(info.index, Math.max(submissions.length - 1, 0)),
              );
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: fallbackIndex,
                  animated: false,
                });
              }, 50);
            }}
            renderItem={({ item }) => (
              <FullscreenSubmissionSlide
                submission={item}
                width={width}
                height={height}
                topInset={insets.top}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  showAllButton: {
    borderWidth: 1,
    borderColor: "rgba(0,206,209,0.38)",
    backgroundColor: "rgba(0,206,209,0.12)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  showAllButtonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  fullscreenHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  fullscreenTitle: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  fullscreenHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fullscreenCounter: {
    color: colors.textMuted,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  fullscreenClose: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
