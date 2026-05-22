import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { AppModalShell } from "~/components/common/ui";

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
  quality?: number;
}

type LensPresetLabel = "0.5x" | "1x" | "2x";
interface LensPresetOption {
  label: LensPresetLabel;
  lens: string;
}

export const toLensPreset = (lens: string): LensPresetLabel | null => {
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

export const buildLensPresetOptions = (lenses: string[]): LensPresetOption[] => {
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
  quality = 0.85,
}: PhotoCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [activeFacing, setActiveFacing] = useState<"front" | "back">(() => facing);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const lensPresetOptions = useMemo(
    () => buildLensPresetOptions(availableLenses),
    [availableLenses],
  );

  const resetState = useCallback(() => {
    setCapturedPhoto(null);
    setIsCapturingPhoto(false);
    setAvailableLenses([]);
    setSelectedLens(undefined);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!visible) {
      queueMicrotask(resetState);
    }
  }, [visible, resetState]);

  const persistCapturedPhoto = useCallback((sourceUri: string) => {
    const destinationDir = new Directory(Paths.document, "captured-photos");
    const fileNameSuffix = Math.random().toString(36).slice(2, 8);
    const extension = sourceUri.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExtension = extension.length > 0 ? extension : "jpg";
    const targetFile = new File(
      destinationDir,
      `capture-${Date.now()}-${fileNameSuffix}.${safeExtension}`,
    );

    try {
      if (!destinationDir.exists) {
        destinationDir.create({ intermediates: true, idempotent: true });
      }
      const sourceFile = new File(sourceUri);
      if (targetFile.exists) {
        targetFile.delete();
      }
      sourceFile.copy(targetFile);
      return targetFile.uri;
    } catch {
      return sourceUri;
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturingPhoto) return;

    try {
      setIsCapturingPhoto(true);
      const picture = await cameraRef.current.takePictureAsync({
        quality,
        exif: true,
        mirror: false,
        skipProcessing: false,
      });

      if (!picture?.uri) return;
      const mimeType: CapturedPhoto["mimeType"] =
        picture.format === "png" ? "image/png" : "image/jpeg";
      const persistedUri = persistCapturedPhoto(picture.uri);

      setCapturedPhoto({
        uri: persistedUri,
        mimeType,
      });
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [isCapturingPhoto, persistCapturedPhoto, quality]);

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
    <AppModalShell visible={visible} title={title} onClose={handleClose} variant="pageSheet">
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          {capturedPhoto ? (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={styles.preview}
              contentFit="contain"
              cachePolicy="none"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.preview}
              facing={activeFacing}
              mirror={false}
              mode="picture"
              autofocus="on"
              responsiveOrientationWhenOrientationLocked
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
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              flexWrap: "wrap",
            }}
          >
            {lensPresetOptions.map((option) => {
              const lens = option.lens;
              const isSelected = selectedLens === lens;
              return (
                <TouchableOpacity
                  key={lens}
                  style={[styles.lensChip, isSelected && styles.lensChipSelected]}
                  onPress={() => setSelectedLens(lens)}
                  disabled={isCapturingPhoto || isUsingPhoto}
                >
                  <Text style={[styles.lensChipText, isSelected && styles.lensChipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.md,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl),
          }}
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
            <View style={styles.captureControlsRow}>
              <View style={styles.captureSideSpacer} />
              <TouchableOpacity
                style={[styles.captureButton, isCapturingPhoto && styles.captureButtonDisabled]}
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
              <TouchableOpacity
                onPress={handleToggleFacing}
                style={styles.captureSideButton}
                disabled={isCapturingPhoto || isUsingPhoto}
              >
                <Ionicons name="camera-reverse-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </AppModalShell>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
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
  captureControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  captureSideSpacer: {
    width: 44,
    height: 44,
  },
  captureSideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
