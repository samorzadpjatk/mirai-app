import { ScrollView, Alert, Dimensions } from "react-native";
import { useLoginForm } from "@mirai-app/frameworks/auth/client";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "../../components/Logo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import { useState } from "react";
import { useSupabaseClient } from "@mirai-app/frameworks/supabase/react";
import { PRIVACY_POLICY_PUBLIC_URL } from "~/config/runtimeEnv";
import Pdf from "react-native-pdf";
import { AppModalShell } from "~/components/common/ui/AppModalShell";
import { FullScreenModal } from "~/components/common/ui/FullScreenModal";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { useFileDownload } from "~/hooks/files";
import { getUrqlClient } from "~/lib/urql-client";

const PRIVACY_POLICY_STORAGE_PATH =
  "files-public/legal/PJApp_Privacy_Policy_PL.pdf";

// GraphQL queries for ban status checks
const CHECK_BAN_STATUS_QUERY = `
  query CheckBanStatus {
    checkBanStatus {
      banned
      bannedUntil
      reason
    }
  }
`;

const CHECK_BAN_STATUS_BY_EMAIL_QUERY = `
  query CheckBanStatusByEmail($email: String!) {
    checkBanStatusByEmail(email: $email) {
      exists
      banned
      bannedUntil
      reason
    }
  }
`;

// Color values for React Native styles
const colors = {
  backgroundDark: "#17181c",
  white: "#ffffff",
  primary: "#00ced1",
  primaryOpacity80: "rgba(0, 206, 209, 0.8)",
  textSecondary: "#9ca3af",
  gray600: "#4b5563",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray700: "#374151",
  danger: "#ef4444",
  red400: "#f87171",
  red700: "#b91c1c",
  red900Opacity30: "rgba(127, 29, 29, 0.3)",
  success: "#22c55e",
  successOpacity08: "rgba(16, 185, 129, 0.08)",
  successOpacity20: "rgba(16, 185, 129, 0.2)",
  borderWhite5: "rgba(255, 255, 255, 0.05)",
  borderWhite10: "rgba(255, 255, 255, 0.1)",
  borderDark: "#395556",
  cardDarkOpacity40: "rgba(27, 40, 40, 0.4)",
  backgroundDarkOpacity50: "rgba(23, 24, 28, 0.5)",
};

export default function LoginScreen() {
  const { formState, setEmail, handleSubmit, clearSent, clearError } =
    useLoginForm();
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
  const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] =
    useState(false);
  const [privacyPolicyError, setPrivacyPolicyError] = useState<string | null>(
    null,
  );
  const [isPolicyModalVisible, setIsPolicyModalVisible] = useState(false);
  const [policyPdfUri, setPolicyPdfUri] = useState<string | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [hasViewedPrivacyPolicy, setHasViewedPrivacyPolicy] = useState(false);
  const privacyPolicyDownload = useFileDownload();
  const privacyPolicyPublicUrl = PRIVACY_POLICY_PUBLIC_URL;

  const { email, isLoading, isSent, error } = formState;
  const ghostEmail =
    (
      process.env.EXPO_PUBLIC_GHOST_LOGIN_EMAIL as string | undefined
    )?.toLowerCase() ?? "";
  const isGhostLogin =
    ghostEmail.length > 0 && email.trim().toLowerCase() === ghostEmail;
  const isBusy = isLoading || passwordLoading;

  /**
   * Check ban status for the currently authenticated user via GraphQL
   */
  const checkBanStatus = async () => {
    try {
      const client = getUrqlClient();
      const result = await client.query(CHECK_BAN_STATUS_QUERY, {}).toPromise();

      if (result.error) {
        console.error("Error checking ban status:", result.error);
        return {
          banned: false,
          bannedUntil: null as string | null,
          reason: null as string | null,
        };
      }

      const data = result.data?.checkBanStatus;
      return {
        banned: data?.banned ?? false,
        bannedUntil: data?.bannedUntil ?? null,
        reason: data?.reason ?? null,
      };
    } catch (error) {
      console.error("Error checking ban status:", error);
      return {
        banned: false,
        bannedUntil: null as string | null,
        reason: null as string | null,
      };
    }
  };

  /**
   * Check ban status by email via GraphQL (pre-login check)
   */
  const checkBanStatusByEmail = async (emailToCheck: string) => {
    try {
      const client = getUrqlClient();
      const result = await client
        .query(CHECK_BAN_STATUS_BY_EMAIL_QUERY, { email: emailToCheck })
        .toPromise();

      if (result.error) {
        console.error("Error checking ban status by email:", result.error);
        return {
          exists: true,
          banned: false,
          bannedUntil: null as string | null,
          reason: null as string | null,
        };
      }

      const data = result.data?.checkBanStatusByEmail;
      return {
        exists: data?.exists ?? true,
        banned: data?.banned ?? false,
        bannedUntil: data?.bannedUntil ?? null,
        reason: data?.reason ?? null,
      };
    } catch (error) {
      console.error("Error checking ban status by email:", error);
      return {
        exists: true,
        banned: false,
        bannedUntil: null as string | null,
        reason: null as string | null,
      };
    }
  };

  const handleBannedLogin = async (
    reason: string | null,
    bannedUntil: string | null,
  ) => {
    await signOut();
    const formattedDate = bannedUntil
      ? new Date(bannedUntil).toLocaleString()
      : "unknown date";
    const message =
      `Your account is banned until ${formattedDate}.` +
      (reason ? ` Reason: ${reason}.` : "");
    if (isGhostLogin) {
      setPasswordError(message);
    } else {
      setVerifyError(message);
    }
  };

  const onSubmit = async () => {
    if (!hasViewedPrivacyPolicy) {
      setPrivacyPolicyError(
        "Najpierw otworz i przeczytaj polityke prywatnosci.",
      );
      return;
    }

    if (!hasAcceptedPrivacyPolicy) {
      setPrivacyPolicyError(
        "Aby się zalogować, musisz zaakceptować politykę prywatności.",
      );
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
          await handleBannedLogin(
            banStatus.reason ?? null,
            banStatus.bannedUntil ?? null,
          );
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
      const status = await checkBanStatusByEmail(email);
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
      const message =
        err instanceof Error ? err.message : "Failed to verify ban status";
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
        await handleBannedLogin(
          banStatus.reason ?? null,
          banStatus.bannedUntil ?? null,
        );
        return;
      }
      router.replace("/");
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Verification failed",
      );
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
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.backgroundDark }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Spacer */}
        <YStack padding={24} paddingBottom={8} paddingTop={insets.top + 24} />

        {/* Logo & Title */}
        <YStack
          paddingHorizontal={24}
          paddingTop={16}
          paddingBottom={32}
          alignItems="center"
        >
          <YStack
            width={188}
            height={188}
            marginBottom={18}
            alignItems="center"
            justifyContent="center"
          >
            <Logo size={188} />
          </YStack>
          <Text
            color="$white"
            fontSize={36}
            fontWeight="bold"
            textAlign="center"
            letterSpacing={-0.5}
          >
            PJApp
          </Text>
          <Text
            color="$textSecondary"
            fontSize={16}
            textAlign="center"
            marginTop={8}
          >
            Unlock your next adventure with PJapp
          </Text>
        </YStack>

        {/* Form Container */}
        <YStack paddingHorizontal={24} flex={1}>
          {/* Error Message */}
          {(error ?? precheckError) && (
            <XStack
              style={{
                backgroundColor: colors.red900Opacity30,
                borderWidth: 1,
                borderColor: colors.red700,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
              }}
              alignItems="center"
              gap={12}
            >
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text color="$red400" fontSize={14} flex={1}>
                {precheckError ?? error}
              </Text>
            </XStack>
          )}

          {/* Inputs Card */}
          <YStack
            style={{
              backgroundColor: colors.cardDarkOpacity40,
              padding: 4,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.borderWhite5,
              marginBottom: 24,
            }}
          >
            {/* Email Input */}
            <YStack
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderWhite5,
              }}
            >
              <Text
                color="$textSecondary"
                fontSize={12}
                fontWeight="bold"
                textTransform="uppercase"
                letterSpacing={1}
                marginBottom={8}
              >
                Email
              </Text>
              <XStack
                style={{
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: colors.backgroundDarkOpacity50,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                }}
              >
                <YStack style={{ opacity: 0.6 }}>
                  <Ionicons name="at" size={20} color={colors.primary} />
                </YStack>
                <Text
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    color: colors.white,
                    fontWeight: "500",
                  }}
                >
                  {email || "s12345@pjwstk.edu.pl"}
                </Text>
              </XStack>
            </YStack>

            {/* Privacy Policy */}
            <YStack
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderWhite5,
              }}
            >
              <XStack
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  opacity: !hasViewedPrivacyPolicy ? 0.55 : 1,
                }}
              >
                <YStack
                  onPress={() => {
                    if (!hasViewedPrivacyPolicy) {
                      setPrivacyPolicyError(
                        "Najpierw otworz i przeczytaj polityke prywatnosci.",
                      );
                      return;
                    }
                    setHasAcceptedPrivacyPolicy((prev) => !prev);
                    setPrivacyPolicyError(null);
                  }}
                >
                  <Ionicons
                    name={
                      hasAcceptedPrivacyPolicy ? "checkbox" : "square-outline"
                    }
                    size={22}
                    color={
                      hasAcceptedPrivacyPolicy
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </YStack>
                <Text color="$gray300" fontSize={14} lineHeight={20} flex={1}>
                  Akceptuj{" "}
                  <Text
                    color="$primary"
                    textDecorationLine="underline"
                    fontSize={14}
                    fontWeight="600"
                    onPress={() => void openPrivacyPolicy()}
                  >
                    politykę prywatności
                  </Text>
                </Text>
              </XStack>
              {privacyPolicyError && (
                <Text color="$red400" fontSize={13} marginTop={6}>
                  {privacyPolicyError}
                </Text>
              )}
            </YStack>

            {isGhostLogin ? (
              <YStack padding={16}>
                <Text
                  color="$textSecondary"
                  fontSize={12}
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing={1}
                  marginBottom={8}
                >
                  Verification Password
                </Text>
                <XStack
                  style={{
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: colors.backgroundDarkOpacity50,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                  }}
                >
                  <YStack style={{ opacity: 0.6 }}>
                    <Ionicons name="key" size={20} color={colors.primary} />
                  </YStack>
                  <Text
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      color: colors.white,
                      fontWeight: "500",
                    }}
                  >
                    {password || "Enter password"}
                  </Text>
                </XStack>
                {passwordError && (
                  <Text
                    color="$red400"
                    textAlign="center"
                    marginBottom={12}
                    marginTop={12}
                  >
                    {passwordError}
                  </Text>
                )}
              </YStack>
            ) : (
              <YStack padding={16}>
                <Text
                  color="$textSecondary"
                  fontSize={12}
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing={1}
                  marginBottom={8}
                >
                  How it works
                </Text>
                <YStack paddingVertical={16}>
                  <Text color="$textSecondary" flex={1}>
                    We'll send a one-time login code to your email. Use the code
                    to sign in.
                  </Text>
                </YStack>
              </YStack>
            )}
          </YStack>

          {!isGhostLogin && (
            <YStack marginBottom={24} alignItems="flex-end">
              <Text color="$primaryOpacity80" fontSize={14} fontWeight="500">
                Didn't receive the email? Check your spam folder or try again.
              </Text>
            </YStack>
          )}

          {/* Sent Confirmation */}
          {!isGhostLogin && isSent && (
            <XStack
              style={{
                backgroundColor: colors.successOpacity08,
                borderWidth: 1,
                borderColor: colors.successOpacity20,
                borderRadius: 12,
                padding: 12,
                marginBottom: 24,
              }}
              alignItems="center"
              gap={12}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <Text color="$success" fontSize={14} flex={1}>
                Check your email — we sent a 6-digit code. Enter it below to
                sign in.
              </Text>
            </XStack>
          )}

          {/* OTP Verification Modal */}
          <AppModalShell
            visible={!!isSent && !isGhostLogin}
            title="Enter verification code"
            onClose={closeModal}
          >
            <Text color="$textSecondary" marginBottom={16}>
              Enter the 6-digit code we sent to{" "}
              <Text fontWeight="bold">{email}</Text>
            </Text>

            <Text
              style={{
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
              }}
            >
              {otp || "123456"}
            </Text>

            {verifyError && (
              <Text color="$red400" textAlign="center" marginBottom={12}>
                {verifyError}
              </Text>
            )}

            <PrimaryLoadingButton
              label="Verify & Sign In"
              isLoading={verifyLoading}
              onPress={onVerify}
            />

            <YStack marginTop={12} onPress={closeModal}>
              <Text color="$textSecondary" textAlign="center">
                Cancel
              </Text>
            </YStack>
          </AppModalShell>

          {/* Login Button */}
          <PrimaryLoadingButton
            label={
              isGhostLogin
                ? "Sign In"
                : isSent
                  ? "Resend Code"
                  : "Send Login Code"
            }
            isLoading={isBusy}
            onPress={onSubmit}
          />

          <YStack height={32} />
        </YStack>
      </ScrollView>

      <FullScreenModal
        visible={isPolicyModalVisible}
        title="Polityka prywatności"
        onClose={closePrivacyPolicy}
      >
        {isPolicyLoading ? (
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            padding={24}
          >
            <Text color="$primary" fontSize={32}>
              *
            </Text>
            <Text color="$textSecondary" marginTop={12}>
              Pobieranie...
            </Text>
          </YStack>
        ) : policyPdfUri ? (
          <Pdf
            source={{ uri: policyPdfUri }}
            style={{
              flex: 1,
              width: Dimensions.get("window").width,
              backgroundColor: colors.backgroundDark,
            }}
            trustAllCerts={false}
            minScale={1}
            maxScale={8}
            onError={() => {
              Alert.alert("Błąd", "Nie udało się otworzyć PDF.");
            }}
          />
        ) : null}
      </FullScreenModal>
    </>
  );
}
