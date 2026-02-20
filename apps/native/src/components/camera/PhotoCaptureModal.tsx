import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import {
  FlipType,
  SaveFormat,
  manipulateAsync,
} from "expo-image-manipulator";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface CapturedPhoto {
  uri: string;
  mimeType: "image/jpeg" | "image/png";
}

interface PhotoCaptureModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onUsePhoto: (photo: CapturedPhoto) => Promise<void> | void;
  isUsingPhoto?: boolean;
  facing?: "front" | "back";
  mirror?: boolean;
  forceHorizontalFlip?: boolean;
  quality?: number;
}

type LensPresetLabel = "0.5x" | "1x" | "2x";
interface LensPresetOption {
  label: LensPresetLabel;
  lens: string;
}

const toLensPreset = (lens: string): LensPresetLabel | null => {
  const normalized = lens.toLowerCase();

  if (normalized.includes("ultrawide")) return "0.5x";
  if (normalized.includes("telephoto")) return "2x";
  if (
    normalized.includes("wideangle") ||
    normalized.includes("dualwide") ||
    normalized.includes("triple") ||
    normalized.includes("dual") ||
    normalized.includes("truedepth") ||
    normalized.includes("front") ||
    normalized.includes("wide")
  ) {
    return "1x";
  }

  return null;
};

const buildLensPresetOptions = (lenses: string[]): LensPresetOption[] => {
  const preferredOrder: LensPresetLabel[] = ["0.5x", "1x", "2x"];
  const picked: Partial<Record<LensPresetLabel, string>> = {};

  for (const lens of lenses) {
    const preset = toLensPreset(lens);
    if (!preset) continue;
    picked[preset] ??= lens;
  }

  return preferredOrder
    .filter((label) => Boolean(picked[label]))
    .map((label) => ({
      label,
      lens: picked[label]!,
    }));
};

export function PhotoCaptureModal({
  visible,
  title,
  onClose,
  onUsePhoto,
  isUsingPhoto = false,
  facing = "front",
  mirror = false,
  forceHorizontalFlip = false,
  quality = 0.85,
}: PhotoCaptureModalProps) {
  const insets = useAppSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [activeFacing, setActiveFacing] = useState<"front" | "back">(facing);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(
    undefined,
  );
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const lensPresetOptions = useMemo(
    () => buildLensPresetOptions(availableLenses),
    [availableLenses],
  );

  useEffect(() => {
    if (visible) return;
    setCapturedPhoto(null);
    setIsCapturingPhoto(false);
    setAvailableLenses([]);
    setSelectedLens(undefined);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setActiveFacing(facing);
  }, [facing, visible]);

  const closeDisabled = isCapturingPhoto || isUsingPhoto;

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturingPhoto) return;

    try {
      setIsCapturingPhoto(true);
      const picture = await cameraRef.current.takePictureAsync({
        quality,
        exif: true,
        mirror,
      });

      if (!picture?.uri) return;

      const saveFormat = picture.format === "png" ? SaveFormat.PNG : SaveFormat.JPEG;
      const mimeType: CapturedPhoto["mimeType"] =
        picture.format === "png" ? "image/png" : "image/jpeg";

      if (forceHorizontalFlip && activeFacing === "front") {
        const flipped = await manipulateAsync(
          picture.uri,
          [{ flip: FlipType.Horizontal }],
          {
            compress: 0.9,
            format: saveFormat,
          },
        ).catch(() => null);

        setCapturedPhoto({
          uri: flipped?.uri ?? picture.uri,
          mimeType,
        });
        return;
      }

      setCapturedPhoto({
        uri: picture.uri,
        mimeType,
      });
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [activeFacing, forceHorizontalFlip, isCapturingPhoto, mirror, quality]);

  const handleUsePhoto = useCallback(() => {
    if (!capturedPhoto || isUsingPhoto) return;
    void onUsePhoto(capturedPhoto);
  }, [capturedPhoto, isUsingPhoto, onUsePhoto]);

  const handleToggleFacing = useCallback(() => {
    if (isCapturingPhoto || isUsingPhoto) return;
    setActiveFacing((current) => (current === "front" ? "back" : "front"));
    setAvailableLenses([]);
    setSelectedLens(undefined);
  }, [isCapturingPhoto, isUsingPhoto]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (closeDisabled) return;
        onClose();
      }}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top + spacing.sm, spacing.lg) },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerActions}>
            {!capturedPhoto ? (
              <TouchableOpacity
                onPress={handleToggleFacing}
                style={styles.iconActionButton}
                disabled={closeDisabled}
              >
                <Ionicons
                  name="camera-reverse-outline"
                  size={20}
                  color={colors.white}
                />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                if (closeDisabled) return;
                onClose();
              }}
              style={styles.closeButton}
              disabled={closeDisabled}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.previewContainer}>
          {capturedPhoto ? (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.preview}
              contentFit="cover"
              cachePolicy="none"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.preview}
              facing={activeFacing}
              mirror={mirror}
              mode="picture"
              autofocus="on"
              selectedLens={selectedLens}
              onAvailableLensesChanged={(event) => {
                const lenses = event?.lenses ?? [];
                const options = buildLensPresetOptions(lenses);
                const selectableLenses = options.map((option) => option.lens);
                setAvailableLenses(lenses);
                setSelectedLens((current) => {
                  if (current && selectableLenses.includes(current)) return current;
                  return selectableLenses[0];
                });
              }}
            />
          )}
        </View>

        {!capturedPhoto && lensPresetOptions.length > 1 ? (
          <View style={styles.lensesContainer}>
            {lensPresetOptions.map((option) => {
              const lens = option.lens;
              const isSelected = selectedLens === lens;
              return (
                <TouchableOpacity
                  key={lens}
                  style={[
                    styles.lensChip,
                    isSelected && styles.lensChipSelected,
                  ]}
                  onPress={() => setSelectedLens(lens)}
                  disabled={isCapturingPhoto || isUsingPhoto}
                >
                  <Text
                    style={[
                      styles.lensChipText,
                      isSelected && styles.lensChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl) },
          ]}
        >
          {capturedPhoto ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionMuted]}
                onPress={() => setCapturedPhoto(null)}
                disabled={isUsingPhoto}
              >
                <Text style={styles.actionMutedText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionPrimary]}
                onPress={handleUsePhoto}
                disabled={isUsingPhoto}
              >
                {isUsingPhoto ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.actionPrimaryText}>Use Photo</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturingPhoto && styles.captureButtonDisabled,
              ]}
              onPress={() => void handleCapture()}
              disabled={isCapturingPhoto}
              activeOpacity={0.85}
            >
              {isCapturingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={22} color={colors.white} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  closeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closeButtonText: {
    color: colors.textMuted,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  preview: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  lensesContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexWrap: "wrap",
  },
  lensChip: {
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  lensChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255,193,7,0.2)",
  },
  lensChipText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: typography.medium,
  },
  lensChipTextSelected: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    height: 48,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  actionMuted: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actionMutedText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionPrimaryText: {
    color: colors.backgroundDark,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.24)",
  },
  captureButtonDisabled: {
    opacity: 0.75,
  },
});
