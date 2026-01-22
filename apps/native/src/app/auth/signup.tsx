import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useSignupForm } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import Logo from "../../components/Logo";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

export default function SignupScreen() {
  const {
    formState,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useSignupForm();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();

  const onSubmit = async () => {
    await handleSubmit(() => {
      setTimeout(() => {
        router.replace("/");
      }, 2000);
    });
  };

  const { name, email, password, confirmPassword, isLoading, error, success } =
    formState;

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Animated.View
            entering={ZoomIn.duration(400).springify()}
            style={styles.successIconWrapper}
          >
            <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
          </Animated.View>
          <Animated.Text
            entering={FadeInUp.delay(200).duration(300)}
            style={styles.successTitle}
          >
            Welcome Aboard!
          </Animated.Text>
          <Text style={styles.successSubtitle}>
            Your account has been created successfully
          </Text>
          <ActivityIndicator size="small" color="#00ced1" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={[styles.formWrapper, { paddingTop: insets.top + 48 }]}>
          {/* Logo */}
          <View style={styles.headerSection}>
            <Logo size={100} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join PJapp today</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="your.email@example.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter password"
                placeholderTextColor="#6b7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.9}
            testID="signup-submit-button"
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#17181c" />
                <Text style={styles.submitButtonText}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formWrapper: {
    padding: 24,
    paddingTop: 48,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    flex: 1,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23262b",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    paddingVertical: 14,
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#00ced1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#17181c",
    fontSize: 16,
    fontWeight: "700",
  },

  // Sign In Link
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    paddingBottom: 24,
  },
  signInText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  signInLink: {
    color: "#00ced1",
    fontSize: 14,
    fontWeight: "700",
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: "#17181c",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successContent: {
    alignItems: "center",
    maxWidth: 400,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
});
