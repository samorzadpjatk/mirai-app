import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { DeckBackground } from "~/components/common/DeckBackground";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { useAdminCoins } from "~/hooks/admin/useAdminCoins";
import { borderRadius, colors, spacing } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface CoinOperationScreenProps {
  operation: "add" | "remove";
}

export function CoinOperationScreen({ operation }: CoinOperationScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{
    tripId?: string | string[];
    groupId?: string | string[];
    groupName?: string | string[];
    groupCoins?: string | string[];
  }>();

  const tripId = useMemo(
    () => (typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "")),
    [params.tripId],
  );
  const groupId = useMemo(
    () => (typeof params.groupId === "string" ? params.groupId : (params.groupId?.[0] ?? "")),
    [params.groupId],
  );
  const groupName = useMemo(
    () => (typeof params.groupName === "string" ? params.groupName : (params.groupName?.[0] ?? "")),
    [params.groupName],
  );
  const navigatedCoins = useMemo(
    () =>
      typeof params.groupCoins === "string" ? params.groupCoins : (params.groupCoins?.[0] ?? "0"),
    [params.groupCoins],
  );

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { groups, addCoins, removeCoins, isAddingCoins, isRemovingCoins } = useAdminCoins(tripId);
  const isSubmitting = operation === "add" ? isAddingCoins : isRemovingCoins;

  // The navigated value is only a seed for the first frame. It was captured
  // when the row was tapped, so on its own it keeps showing a balance that a
  // concurrent award has already moved on from.
  const liveCoins = groups.find((group) => group.id === groupId)?.coins;
  const groupCoins = liveCoins === undefined ? navigatedCoins : String(liveCoins);

  const submit = async () => {
    const numericAmount = Number.parseInt(amount, 10);
    if (!tripId || !groupId) {
      Alert.alert("Error", "Trip and group are required.");
      return;
    }
    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Validation", "Enter a valid positive amount.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Validation", "Reason is required.");
      return;
    }

    try {
      if (operation === "add") {
        await addCoins(groupId, numericAmount, reason.trim());
      } else {
        await removeCoins(groupId, numericAmount, reason.trim());
      }
      Alert.alert("Success", `Coins ${operation === "add" ? "added" : "removed"} successfully.`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch {
      Alert.alert("Error", "Operation failed. Try again.");
    }
  };

  const title = operation === "add" ? "Add Coins" : "Remove Coins";
  const subtitle = groupName
    ? `${operation === "add" ? "Add" : "Remove"} coins ${operation === "add" ? "to" : "from"} ${groupName}`
    : `${operation === "add" ? "Add" : "Remove"} coins for group`;
  const buttonLabel = operation === "add" ? "Add Coins" : "Remove Coins";
  const reasonPlaceholder =
    operation === "add"
      ? "Describe why you are adding coins"
      : "Describe why you are removing coins";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />
      <DeckBackground />

      <AdminHeader title={title} subtitle={subtitle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <ThemedTextInput
              value={groupName}
              editable={false}
              placeholder="Group name"
              style={styles.readOnlyInput}
            />
          </View>
          <View style={styles.summaryRow}>
            <ThemedTextInput
              value={`${groupCoins} coins`}
              editable={false}
              placeholder="Current balance"
              style={styles.readOnlyInput}
            />
          </View>
        </View>

        <FormField label="Amount" required={true}>
          <ThemedTextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="Reason" required={true}>
          <ThemedTextInput
            value={reason}
            onChangeText={setReason}
            placeholder={reasonPlaceholder}
            multiline={true}
            numberOfLines={3}
            style={styles.textArea}
          />
        </FormField>

        <PrimaryLoadingButton
          label={buttonLabel}
          onPress={() => void submit()}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundDark,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
      gap: spacing.md,
    },
    summaryCard: {
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderWhite5,
      padding: spacing.md,
      gap: spacing.sm,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    readOnlyInput: {
      color: colors.textPrimary,
    },
    textArea: {
      minHeight: 96,
      textAlignVertical: "top",
    },
  });
}
