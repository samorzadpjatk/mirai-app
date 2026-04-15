import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";
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
  quality = 0.85,
}: PhotoCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [activeFacing, setActiveFacing] = useState<"front" | "back">(facing);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(
    undefined,
  );
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(
    null,
  );
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

  const persistCapturedPhoto = useCallback((sourceUri: string) => {
    const destinationDir = new Directory(Paths.document, "captured-photos");
    const fileNameSuffix = Math.random().toString(36).slice(2, 8);
    const extension =
      sourceUri.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "jpg";
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
    <AppModalShell
      visible={visible}
      title={title}
      onClose={onClose}
      variant="pageSheet"
    >
      <YStack flex={1}>
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
          {capturedPhoto ? (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={nativeStyles.preview}
              contentFit="contain"
              cachePolicy="none"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={nativeStyles.preview}
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
                  if (current && selectableLenses.includes(current))
                    return current;
                  return selectableLenses[0];
                });
              }}
            />
          )}
        </YStack>

        {!capturedPhoto && lensPresetOptions.length > 1 ? (
          <XStack
            gap="$2"
            paddingHorizontal="$4"
            paddingTop="$3"
            flexWrap="wrap"
          >
            {lensPresetOptions.map((option) => {
              const lens = option.lens;
              const isSelected = selectedLens === lens;
              return (
                <TouchableOpacity
                  key={lens}
                  style={[
                    nativeStyles.lensChip,
                    isSelected && nativeStyles.lensChipSelected,
                  ]}
                  onPress={() => setSelectedLens(lens)}
                  disabled={isCapturingPhoto || isUsingPhoto}
                >
                  <Text
                    fontSize={12}
                    fontWeight={isSelected ? "bold" : "500"}
                    color={isSelected ? "$primary" : "white"}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </XStack>
        ) : null}

        <XStack
          alignItems="center"
          justifyContent="center"
          gap="$3"
          paddingTop="$3"
          paddingHorizontal="$4"
          paddingBottom={Math.max(insets.bottom + 12, 24)}
        >
          {capturedPhoto ? (
            <>
              <Button
                variant="outlined"
                onPress={() => setCapturedPhoto(null)}
                disabled={isUsingPhoto}
              >
                Retake
              </Button>
              <Button onPress={handleUsePhoto} disabled={isUsingPhoto}>
                Use Photo
              </Button>
            </>
          ) : (
            <XStack alignItems="center" gap="$3">
              <YStack width={44} height={44} />
              <TouchableOpacity
                style={[
                  nativeStyles.captureButton,
                  isCapturingPhoto && nativeStyles.captureButtonDisabled,
                ]}
                onPress={() => void handleCapture()}
                disabled={isCapturingPhoto}
                activeOpacity={0.85}
              >
                {isCapturingPhoto ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={22} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleToggleFacing}
                style={nativeStyles.captureSideButton}
                disabled={isCapturingPhoto || isUsingPhoto}
              >
                <Ionicons
                  name="camera-reverse-outline"
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
            </XStack>
          )}
        </XStack>
      </YStack>
    </AppModalShell>
  );
}

// Native styles for react-native components
const nativeStyles = {
  preview: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden" as const,
  },
  lensChip: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  lensChipSelected: {
    borderColor: "#00ced1",
    backgroundColor: "rgba(255,193,7,0.2)",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#00ced1",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.24)",
  },
  captureButtonDisabled: {
    opacity: 0.75,
  },
  captureSideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
};
