import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { colors } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";
import type { ApprovedSubmissionItem } from "./GroupApprovedChallenges";

interface Props {
  submission: ApprovedSubmissionItem;
  onPress: () => void;
}

export default function SubmissionCircle({ submission, onPress }: Props) {
  const { palette } = useTripTheme();
  return (
    <TouchableOpacity
      testID="submission-circle"
      style={styles.item}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {submission.imageStoragePath ? (
          <CachedImage
            testID="submission-image"
            storagePath={submission.imageStoragePath}
            style={styles.image}
            contentFit="cover"
            fallback={
              <View testID="image-fallback" style={styles.imageFallback}>
                <ActivityIndicator
                  testID="loading-indicator"
                  size="small"
                  color={palette.primary}
                />
              </View>
            }
          />
        ) : (
          <View testID="image-fallback" style={styles.imageFallback}>
            <ActivityIndicator testID="loading-indicator" size="small" color={palette.primary} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {submission.challengeTitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "22%",
    alignItems: "center",
    gap: 4,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    color: colors.white,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
});
