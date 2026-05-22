import React, { useEffect } from "react";
import { ActivityIndicator, TouchableOpacity, View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { colors } from "~/styles";
import type { ApprovedSubmissionItem } from "./GroupApprovedChallenges";

interface Props {
  submission: ApprovedSubmissionItem;
  onPress: () => void;
}

export default function SubmissionCircle({ submission, onPress }: Props) {
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <TouchableOpacity testID="submission-circle" style={styles.item} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
        {status === "loading" ? (
          <View testID="loading-indicator" style={styles.imageFallback}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : file?.uri ? (
          <Image testID="submission-image" source={{ uri: file.uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View testID="image-fallback" style={styles.imageFallback}>
            <Ionicons name="image-outline" size={18} color={colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {submission.challengeTitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = {
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
};
