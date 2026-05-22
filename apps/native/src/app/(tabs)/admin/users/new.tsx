import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "~/styles";
import { isNameValid, isNonEmptyString } from "~/utils/validation";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

export default function AdminCreateUserScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const createUserMutation = useMutation(
    orpc.user.createUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        Alert.alert("Success", "User created successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to create user: ${error.message}`);
      },
    }),
  );

  const isValid = isNameValid(firstName, lastName) && isNonEmptyString(email);

  const handleSubmit: () => void = () => {
    if (!isValid) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }

    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
      return;
    }

    void createUserMutation.mutateAsync({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      tripId,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Create User" subtitle="Add a new user to the system" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FormField label="First name" required>
          <ThemedTextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Last name" required>
          <ThemedTextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Email" required>
          <ThemedTextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email..."
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormField>

        <PrimaryLoadingButton
          label="Create User"
          isLoading={createUserMutation.isPending}
          onPress={handleSubmit}
          disabled={!isValid || createUserMutation.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
