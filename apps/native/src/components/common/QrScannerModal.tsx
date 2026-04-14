import React, { useCallback, useRef, useState } from "react";
import { Alert, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button } from "@mirai-app/ui";

export interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  instructionText?: string;
  onScan: (data: string) => void | Promise<void>;
  scanOncePerSession?: boolean;
}

export function QrScannerModal({
  visible,
  onClose,
  title = "Scan QR code",
  instructionText = "Point camera at QR code to scan.",
  onScan,
  scanOncePerSession = true,
}: QrScannerModalProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasScannedThisSession, setHasScannedThisSession] = useState(false);
  const scanLockRef = useRef(false);
  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = async (event: { data: string }) => {
    if (scanOncePerSession && hasScannedThisSession) return;
    if (scanLockRef.current) return;

    scanLockRef.current = true;
    if (scanOncePerSession) {
      setHasScannedThisSession(true);
    }

    try {
      await onScan(event.data);
      onClose();
    } catch (error) {
      onClose();
      const message =
        error instanceof Error ? error.message : "Invalid QR code";
      Alert.alert("Invalid QR code", message);
    } finally {
      scanLockRef.current = false;
    }
  };

  const handleClose = () => {
    scanLockRef.current = false;
    setHasScannedThisSession(false);
    onClose();
  };

  const requestPermission = useCallback(async () => {
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission?.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is needed to scan QR code.",
      );
      return false;
    }
    return true;
  }, [cameraPermission, requestCameraPermission]);

  // Reset session state when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setHasScannedThisSession(false);
      scanLockRef.current = false;
      void requestPermission();
    }
  }, [visible, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <YStack flex={1} backgroundColor="$backgroundDark">
        <XStack
          paddingHorizontal="$lg"
          paddingBottom="$md"
          paddingTop={Math.max(insets.top + 8, 20)}
          alignItems="center"
          justifyContent="space-between"
        >
          <Text color="$white" fontSize={20} fontWeight="700">
            {title}
          </Text>
          <Button
            onPress={handleClose}
            paddingVertical="$xs"
            paddingHorizontal="$sm"
            chromeless
          >
            <Text color="$textSecondary" fontSize={16}>
              Close
            </Text>
          </Button>
        </XStack>

        <YStack flex={1}>
          {cameraPermission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={
                scanOncePerSession && hasScannedThisSession
                  ? undefined
                  : handleBarcodeScanned
              }
            />
          ) : (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              paddingHorizontal="$xl"
            >
              <Text
                color="$textSecondary"
                fontSize={16}
                textAlign="center"
                marginBottom="$lg"
              >
                Camera permission is required to scan QR codes.
              </Text>
              <Button
                onPress={requestPermission}
                backgroundColor="$primary"
                paddingHorizontal="$lg"
                paddingVertical="$md"
                borderRadius="$2"
              >
                <Text color="$white" fontSize={16} fontWeight="600">
                  Grant Permission
                </Text>
              </Button>
            </YStack>
          )}
        </YStack>

        <YStack paddingHorizontal="$lg" paddingVertical="$md">
          <Text color="$textSecondary" fontSize={14} textAlign="center">
            {instructionText}
          </Text>
        </YStack>
      </YStack>
    </Modal>
  );
}
