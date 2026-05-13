import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useLoginForm } from "@mirai-app/auth/client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@mirai-app/auth/client";
import { useState } from "react";
import { useSupabaseClient } from "@mirai-app/supabase/react";
import { getORPCClient } from "@mirai-app/orpc/client";
import { PRIVACY_POLICY_PUBLIC_URL, TRPC_HTTP_URL, TRPC_WS_URL } from "~/config/runtimeEnv";
import Pdf from "react-native-pdf";
import { AppModalShell } from "~/components/common/ui/AppModalShell";
import { FullScreenModal } from "~/components/common/ui/FullScreenModal";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { colors } from "~/styles";
import { useFileDownload } from "~/hooks/files";

const PRIVACY_POLICY_STORAGE_PATH = "files-public/legal/PJApp_Privacy_Policy_PL.pdf";

export default function LoginScreen() {
  const { formState, setEmail, handleSubmit, clearSent, clearError } = useLoginForm();
  const { verifyOtp, signInWithPassword, signOut } = useAuth();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] = useState(false);
  const [privacyPolicyError, setPrivacyPolicyError] = useState<string | null>(null);
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false);
  const [policyPdfUri, setPolicyPdfUri] = useState<string | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [hasViewedPrivacyPolicy, setHasViewedPrivacyPolicy] = useState(false);
  const privacyPolicyDownload = useFileDownload();
  const privacyPolicyPublicUrl = PRIVACY_POLICY_PUBLIC_URL;

  const { email, isLoading, isSent, error } = formState;
  const ghostEmail =
    (process.env.EXPO_PUBLIC_GHOST_LOGIN_EMAIL as string | undefined)?.toLowerCase() ?? "";
  const isGhostLogin = ghostEmail.length > 0 && email.trim().toLowerCase() === ghostEmail;
  const isBusy = isLoading || passwordLoading;

  const checkBanStatus = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { banned: false, bannedUntil: null as string | null, reason: null as string | null };
    }
    const { client, cleanup } = getORPCClient(TRPC_HTTP_URL, TRPC_WS_URL, token);
    try {
      return await client.user.getBanStatus({});
    } finally {
      await cleanup();
    }
  };

  const checkBanStatusByEmail = async () => {
    const { client, cleanup } = getORPCClient(TRPC_HTTP_URL, TRPC_WS_URL);
    try {
      return await client.user.getBanStatusByEmail({ email });
    } finally {
      await cleanup();
    }
  };

  const handleBannedLogin = async (reason: string | null, bannedUntil: string | null) => {
    await signOut();
    const formattedDate = bannedUntil ? new Date(bannedUntil).toLocaleString() : "unknown date";
    const message =
      `Your account is banned until ${formattedDate}.` + (reason ? ` Reason: ${reason}.` : "");
    if (isGhostLogin) {
      setPasswordError(message);
    } else {
      setVerifyError(message);
    }
  };

  const onSubmit = async () => {
    if (!hasViewedPrivacyPolicy) {
      setPrivacyPolicyError("Najpierw otworz i przeczytaj polityke prywatnosci.");
      return;
    }

    if (!hasAcceptedPrivacyPolicy) {
      setPrivacyPolicyError("Aby się zalogować, musisz zaakceptować politykę prywatności.");
      return;
    }

    setPrivacyPolicyError(null);

    if (isGhostLogin) {
      if (!password) {
        setPasswordError("Please enter the verification password");
        return;
      }

      setPasswordLoading(true);
      setPasswordError(null);

      try {
        await signInWithPassword({ email, password });
        const banStatus = await checkBanStatus();
        if (banStatus.banned) {
          await handleBannedLogin(banStatus.reason ?? null, banStatus.bannedUntil ?? null);
          return;
        }
        router.replace("/");
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : "Sign in failed");
      } finally {
        setPasswordLoading(false);
      }
      return;
    }

    if (!email.trim()) {
      await handleSubmit();
      return;
    }

    setPrecheckError(null);
    clearError();

    try {
      const status = await checkBanStatusByEmail();
      if (status?.exists === false) {
        clearSent();
        setPrecheckError(
          "This email is not in database. Use your email that you provided on Taksidi site.",
        );
        return;
      }
      if (status?.banned) {
        clearSent();
        const formattedDate = status.bannedUntil
          ? new Date(status.bannedUntil).toLocaleString()
          : "unknown date";
        const message =
          `Your account is banned until ${formattedDate}.` +
          (status.reason ? ` Reason: ${status.reason}.` : "");
        setPrecheckError(message);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify ban status";
      setPrecheckError(message);
      return;
    }

    await handleSubmit();
  };

  const onEmailChange = (value: string) => {
    clearError();
    clearSent();
    setPrecheckError(null);
    setPasswordError(null);
    setPrivacyPolicyError(null);
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
      const banStatus = await checkBanStatus();
      if (banStatus.banned) {
        await handleBannedLogin(banStatus.reason ?? null, banStatus.bannedUntil ?? null);
        return;
      }
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

  const openPrivacyPolicy = async () => {
    setIsPolicyModalVisible(true);

    if (policyPdfUri || isPolicyLoading) {
      return;
    }

    setIsPolicyLoading(true);

    try {
      const result = await privacyPolicyDownload.download({
        storagePath: PRIVACY_POLICY_STORAGE_PATH,
        publicUrl: privacyPolicyPublicUrl,
      });
      setPolicyPdfUri(result.uri);
    } catch (err) {
      setIsPolicyModalVisible(false);
      Alert.alert("Błąd", "Nie udało się otworzyć polityki prywatności.");
      console.error("[PrivacyPolicy] download error:", err);
    } finally {
      setIsPolicyLoading(false);
    }
  };

  const closePrivacyPolicy = () => {
    setIsPolicyModalVisible(false);
    if (!isPolicyLoading && policyPdfUri) {
      setHasViewedPrivacyPolicy(true);
      setPrivacyPolicyError(null);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Spacer */}
        <View style={[styles.headerSpacer, { paddingTop: insets.top + 24 }]} />

        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Logo size={188} />
          </View>
          <Text style={styles.title}>PJApp</Text>
          <Text style={styles.subtitle}>Unlock your next adventure with PJapp</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {(error ?? precheckError) && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{precheckError ?? error}</Text>
            </View>
          )}

          {/* Inputs Card */}
          <View style={styles.inputsCard}>
            {/* Email Input */}
            <View style={[styles.inputSection, styles.inputSectionBorder]}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconOpacity}>
                  <Ionicons name="at" size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="s12345@pjwstk.edu.pl"
                  placeholderTextColor={colors.gray600}
                  value={email}
                  onChangeText={onEmailChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isBusy}
                />
              </View>
            </View>

            {/* Privacy Policy */}
            <View style={[styles.inputSection, styles.inputSectionBorder]}>
              <TouchableOpacity
                style={[styles.policyCheckboxRow, !hasViewedPrivacyPolicy && { opacity: 0.55 }]}
                onPress={() => {
                  if (!hasViewedPrivacyPolicy) {
                    setPrivacyPolicyError("Najpierw otworz i przeczytaj polityke prywatnosci.");
                    return;
                  }
                  setHasAcceptedPrivacyPolicy((prev) => !prev);
                  setPrivacyPolicyError(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={hasAcceptedPrivacyPolicy ? "checkbox" : "square-outline"}
                  size={22}
                  color={hasAcceptedPrivacyPolicy ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.policyCheckboxText}>
                  Akceptuj{" "}
                  <Text style={styles.policyLink} onPress={() => void openPrivacyPolicy()}>
                    politykę prywatności
                  </Text>
                </Text>
              </TouchableOpacity>
              {privacyPolicyError && (
                <Text style={[styles.policyErrorText, { marginTop: 6 }]}>{privacyPolicyError}</Text>
              )}
            </View>

            {isGhostLogin ? (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Verification Password</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconOpacity}>
                    <Ionicons name="key" size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor={colors.gray600}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                    editable={!isBusy}
                  />
                </View>
                {passwordError && <Text style={styles.modalErrorText}>{passwordError}</Text>}
              </View>
            ) : (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>How it works</Text>
                <View style={[styles.inputWrapper, { paddingVertical: 16 }]}>
                  <Text style={{ color: colors.textSecondary, flex: 1 }}>
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
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successText}>
                Check your email — we sent a 6-digit code. Enter it below to sign in.
              </Text>
            </View>
          )}

          {/* OTP Verification Modal */}
          <AppModalShell
            visible={!!isSent && !isGhostLogin}
            title="Enter verification code"
            onClose={closeModal}
          >
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit code we sent to <Text style={{ fontWeight: "bold" }}>{email}</Text>
            </Text>

            <TextInput
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              style={styles.otpInput}
              editable={!verifyLoading}
            />

            {verifyError && <Text style={styles.modalErrorText}>{verifyError}</Text>}

            <PrimaryLoadingButton
              label="Verify & Sign In"
              isLoading={verifyLoading}
              onPress={onVerify}
              style={styles.verifyButton}
            />

            <TouchableOpacity style={{ marginTop: 12 }} onPress={closeModal}>
              <Text style={{ color: colors.textSecondary, textAlign: "center" }}>Cancel</Text>
            </TouchableOpacity>
          </AppModalShell>

          {/* Login Button */}
          <PrimaryLoadingButton
            label={isGhostLogin ? "Sign In" : isSent ? "Resend Code" : "Send Login Code"}
            isLoading={isBusy}
            onPress={onSubmit}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      <FullScreenModal
        visible={isPolicyModalVisible}
        title="Polityka prywatności"
        onClose={closePrivacyPolicy}
      >
        {isPolicyLoading ? (
          <View style={styles.policyModalLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.policyText, { marginTop: 12, color: colors.textSecondary }]}>
              Pobieranie...
            </Text>
          </View>
        ) : policyPdfUri ? (
          <Pdf
            source={{ uri: policyPdfUri }}
            style={styles.policyPdf}
            trustAllCerts={false}
            minScale={1}
            maxScale={8}
            onError={(err) => {
              console.error("[PrivacyPolicy] PDF error:", err);
              Alert.alert("Błąd", "Nie udało się otworzyć PDF.");
            }}
          />
        ) : null}
      </FullScreenModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
    width: 188,
    height: 188,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.red900Opacity30,
    borderWidth: 1,
    borderColor: colors.red700,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    color: colors.red400,
    fontSize: 14,
    flex: 1,
  },
  inputsCard: {
    backgroundColor: colors.cardDarkOpacity40,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    marginBottom: 24,
  },
  inputSection: {
    padding: 16,
  },
  inputSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  inputLabel: {
    color: colors.textSecondary,
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
    backgroundColor: colors.backgroundDarkOpacity50,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  iconOpacity: {
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    color: colors.white,
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primaryOpacity80,
    fontSize: 14,
    fontWeight: "500",
  },
  successContainer: {
    backgroundColor: colors.successOpacity08,
    borderWidth: 1,
    borderColor: colors.successOpacity20,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    flex: 1,
  },
  loginButton: {
    width: "100%",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  loginButtonText: {
    color: colors.backgroundDark,
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
    backgroundColor: colors.borderWhite10,
  },
  dividerText: {
    color: colors.gray600,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: colors.backgroundDarkOpacity50,
    color: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray700,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  modalErrorText: {
    color: colors.red400,
    textAlign: "center",
    marginBottom: 12,
  },
  verifyButton: {
    marginVertical: 8,
  },
  policyCheckboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  policyCheckboxText: {
    color: colors.gray300,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  policyErrorText: {
    color: colors.red400,
    fontSize: 13,
  },
  policyHintText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  policyLink: {
    color: colors.primary,
    textDecorationLine: "underline",
    fontSize: 14,
    fontWeight: "600",
  },
  policyText: {
    color: colors.gray200,
    fontSize: 13,
    lineHeight: 19,
  },
  policyModalLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  policyPdf: {
    flex: 1,
    width: Dimensions.get("window").width,
    backgroundColor: colors.backgroundDark,
  },
});
