import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useClient, useMutation } from "urql";
import {
  CreateUserDocument,
  GetUsersDocument,
  type CreateUserInput,
} from "@mirai-app/graphql-types/urql";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

export default function AdminCreateUserScreen() {
  const router = useRouter();
  const client = useClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // GraphQL mutation for creating user using generated document
  const [{ fetching: isPending }, createUser] = useMutation(CreateUserDocument);

  const handleSubmit = async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      Alert.alert("Validation", "All fields are required.");
      return;
    }

    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
      return;
    }

    try {
      const result = await createUser({
        input: {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail,
          tripId,
        } as CreateUserInput,
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate users query cache
      await client.invalidate(GetUsersDocument, {
        limit: 100,
        offset: 0,
      });

      Alert.alert("Success", "User created successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      Alert.alert("Error", errorMessage);
    }
  };

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Create User"
        subtitle="Add a new user to the system"
      />

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
          isLoading={isPending}
          onPress={handleSubmit}
          disabled={!isValid || isPending}
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
