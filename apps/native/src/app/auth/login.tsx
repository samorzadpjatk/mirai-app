import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Modal } from "react-native";
import { useLoginForm } from "@integral-2025-app/auth/client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useAppSafeAreaInsets } from '~/contexts/SafeAreaInsetsContext';
import { useAuth } from "@integral-2025-app/auth/client";
import { useState } from "react";

export default function LoginScreen() {
  const { formState, setEmail, handleSubmit, clearSent, clearError } = useLoginForm();
  const { verifyOtp, signInWithPassword } = useAuth();
  const router = useRouter();
  const insets = useAppSafeAreaInsets();

  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { email, isLoading, isSent, error } = formState;
  const ghostEmail =
    process.env.EXPO_PUBLIC_GHOST_LOGIN_EMAIL?.toLowerCase() ?? "";
  const isGhostLogin =
    ghostEmail.length > 0 && email.trim().toLowerCase() === ghostEmail;
  const isBusy = isLoading || passwordLoading;

  const onSubmit = async () => {
    if (isGhostLogin) {
      if (!password) {
        setPasswordError("Please enter the verification password");
        return;
      }

      setPasswordLoading(true);
      setPasswordError(null);

      try {
        await signInWithPassword({ email, password });
        router.replace("/");
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : "Sign in failed");
      } finally {
        setPasswordLoading(false);
      }
      return;
    }

    await handleSubmit();
  };

  const onEmailChange = (value: string) => {
    clearError();
    clearSent();
    setPasswordError(null);
    setPassword("");
    setEmail(value);
  };

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Spacer */}
        <View style={[styles.headerSpacer, { paddingTop: insets.top + 24 }]} />

        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Logo size={96} />
          </View>
          <Text style={styles.title}>
            Welcome back
          </Text>
          <Text style={styles.subtitle}>
            Unlock your next adventure with PJapp
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Inputs Card */}
          <View style={styles.inputsCard}>
            {/* Email Input */}
            <View style={[styles.inputSection, styles.inputSectionBorder]}>
              <Text style={styles.inputLabel}>
                Student Email or ID
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconOpacity}>
                  <Ionicons name="at" size={20} color="#00ced1" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="s12345@pjwstk.edu.pl"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={onEmailChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isBusy}
                />
              </View>
            </View>

            {isGhostLogin ? (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Verification Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconOpacity}>
                    <Ionicons name="key" size={20} color="#00ced1" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor="#4b5563"
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                    editable={!isBusy}
                  />
                </View>
                {passwordError && (
                  <Text style={styles.modalErrorText}>{passwordError}</Text>
                )}
              </View>
            ) : (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>
                  How it works
                </Text>
                <View style={[styles.inputWrapper, { paddingVertical: 16 }]}>
                  <Text style={{ color: "#9ca3af", flex: 1 }}>
                    We'll send a one-time login code to your email. Use the code to sign in.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {!isGhostLogin && (
            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>
                Didn't receive the email? Check your spam folder or try again.
              </Text>
            </View>
          )}

          {/* Sent Confirmation */}
          {!isGhostLogin && isSent && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>
                Check your email — we sent a 6-digit code. Enter it below to sign in.
              </Text>
            </View>
          )}

          {/* OTP Verification Modal */}
          <Modal
            visible={!!isSent && !isGhostLogin}
            animationType="slide"
            transparent
            onRequestClose={closeModal}
          >
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

                <TouchableOpacity
                  style={[styles.verifyButton, verifyLoading && { opacity: 0.6 }]}
                  onPress={onVerify}
                  disabled={verifyLoading}
                  activeOpacity={0.9}
                >
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

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={onSubmit}
            disabled={isBusy}
            activeOpacity={0.9}
          >
            {isBusy ? (
              <>
                <ActivityIndicator color="#17181c" />
                <Text style={styles.loginButtonText}>
                  {isGhostLogin ? "Signing In..." : "Sending Code..."}
                </Text>
              </>
            ) : isGhostLogin ? (
              <>
                <Text style={styles.loginButtonText}>
                  Sign In
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#17181c" />
              </>
            ) : isSent ? (
              <>
                <Text style={styles.loginButtonText}>
                  Resend Code
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#17181c" />
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  Send Login Code
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#17181c" />
              </>
            )}
          </TouchableOpacity>

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
  iconOpacity: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    color: "white",
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "rgba(0, 206, 209, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  successContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  successText: {
    color: "#10b981",
    fontSize: 14,
    flex: 1,
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 32,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
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
});
