import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaTop } from "~/components/SafeAreaWrapper";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface FullScreenModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FullScreenModal({ visible, title, onClose, children }: FullScreenModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
      testID="fullscreen-modal"
    >
      <View style={styles.container}>
        <SafeAreaTop style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} testID="fullscreen-modal-close">
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
          </View>
        </SafeAreaTop>
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  safeArea: {
    backgroundColor: colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryOpacity10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryOpacity10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
});
