import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Modal } from "react-native";
import { useSignupForm, useAuth } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';
import { useState } from "react";

export default function SignupScreen() {
  const { formState, setName, setEmail, handleSubmit, clearSent, clearError } = useSignupForm();
  const { verifyOtp } = useAuth();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();

  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const onSubmit = async () => {
    await handleSubmit();
  };

  const { name, email, isLoading, isSent, error } = formState;

  const onVerify = async () => {
    if (!otp || otp.length < 6) {
      setVerifyError("Please enter the 6-digit code");
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);

    try {
      await verifyOtp({ email, token: otp });
      router.replace("/");
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const closeModal = () => {
    setOtp("");
    setVerifyError(null);
    clearSent();
  };

  return (
    <>
      <StatusBar style="light" />
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.headerSpacer, { paddingTop: insets.top + 24 }]} />

        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Logo size={96} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PJapp today</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputsCard}>
            <View style={[styles.inputSection, styles.inputSectionBorder]}>
              <Text style={styles.inputLabel}>Full name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#4b5563"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Student Email or ID</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="at" size={20} color="#00ced1" />
                <TextInput
                  style={styles.textInput}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={(v) => { clearError(); clearSent(); setEmail(v); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.9}
            testID="signup-submit-button"
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#17181c" />
                <Text style={styles.loginButtonText}>Creating Account...</Text>
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color="#17181c" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.signupText}>
              Already have an account?{' '}
              <Text style={styles.signupLink} onPress={() => router.push('/auth/login')}>Sign In</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!isSent} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter verification code</Text>
            <Text style={styles.modalSubtitle}>Enter the 6-digit code we sent to <Text style={{fontWeight: 'bold'}}>{email}</Text></Text>

            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor="#9ca3af"
              style={styles.otpInput}
              editable={!verifyLoading}
            />

            {verifyError && <Text style={styles.modalErrorText}>{verifyError}</Text>}

            <TouchableOpacity style={[styles.verifyButton, verifyLoading && { opacity: 0.6 }]} onPress={onVerify} disabled={verifyLoading} activeOpacity={0.9}>
              {verifyLoading ? (
                <ActivityIndicator color="#17181c" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 12 }} onPress={closeModal}>
              <Text style={{ color: '#9ca3af', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // reusing styles from login.tsx
  container: {
    flex: 1,
    backgroundColor: "#17181c",
  },
  headerSpacer: {
    padding: 24,
    paddingBottom: 8,
  },
  logoContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoWrapper: {
    marginBottom: 24,
  },
  title: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: "rgba(127, 29, 29, 0.3)",
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    flex: 1,
  },
  inputsCard: {
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 24,
  },
  inputSection: {
    padding: 16,
  },
  inputSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(23, 24, 28, 0.5)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#395556",
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    color: "white",
    fontWeight: "500",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#00ced1",
    borderRadius: 12,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#00ced1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonText: {
    color: "#17181c",
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    marginTop: "auto",
    padding: 24,
  },
  signupText: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 14,
  },
  signupLink: {
    color: "white",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#0f1113",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#9ca3af",
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: "rgba(23,24,28,0.5)",
    color: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  modalErrorText: {
    color: "#f87171",
    textAlign: "center",
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: "#00ced1",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#17181c",
    fontWeight: "bold",
    fontSize: 16,
  },
});