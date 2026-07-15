import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

export interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  instructionText?: string;
  onScan: (data: string) => void | Promise<void>;
  scanOncePerSession?: boolean;
}

export function shouldDisableScanning(
  scanOncePerSession: boolean,
  hasScannedThisSession: boolean,
): boolean {
  return scanOncePerSession && hasScannedThisSession;
}

export function formatScanErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Invalid QR code";
}

export function QrScannerModal({
  visible,
  onClose,
  title = "Scan QR code",
  instructionText = "Point camera at QR code to scan.",
  onScan,
  scanOncePerSession = true,
}: QrScannerModalProps) {
  const styles = useThemedStyles(makeStyles);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasScannedThisSession, setHasScannedThisSession] = useState(false);
  const scanLockRef = useRef(false);
  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = async (event: { data: string }) => {
    if (shouldDisableScanning(scanOncePerSession, hasScannedThisSession)) return;
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
      Alert.alert("Invalid QR code", formatScanErrorMessage(error));
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
      Alert.alert("Permission required", "Camera permission is needed to scan QR code.");
      return false;
    }
    return true;
  }, [cameraPermission, requestCameraPermission]);

  React.useEffect(() => {
    if (visible) {
      scanLockRef.current = false;
      void requestPermission();
    }
  }, [visible, requestPermission]);

  return (
    <Modal
      testID="qr-scanner-modal"
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View
          style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) }]}
        >
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.cameraContainer}>
          {cameraPermission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={
                scanOncePerSession && hasScannedThisSession ? undefined : handleBarcodeScanned
              }
            />
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                Camera permission is required to scan QR codes.
              </Text>
              <Pressable style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{instructionText}</Text>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: colors.white,
      fontSize: 20,
      fontWeight: "700",
    },
    closeButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    closeText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    cameraContainer: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
    },
    permissionText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    permissionButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
    },
    permissionButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
  });
}
