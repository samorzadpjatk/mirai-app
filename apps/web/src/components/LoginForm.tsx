"use client";

/**
 * Login Form Component
 *
 * Two-phase OTP login form with email input and OTP verification.
 * Uses react-hook-form for state management and Zod for validation.
 *
 * Phase 1: Email input with validation and OTP request
 * Phase 2: OTP verification with retry and resend capability
 *
 * Features:
 * - Email format validation with Zod
 * - OTP state machine (idle → pending → verifying → verified/failed)
 * - Resend OTP with cooldown timer
 * - Loading states and error messages
 * - Admin role verification after login
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Text, H2, Body, YStack, XStack } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import { OTPCodeInput } from "./OTPCodeInput";
import { authClient, type Session, formatAuthError } from "@/lib/auth";

// =============================================================================
// Form Validation Schemas
// =============================================================================

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Please enter all 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must be 6 digits"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

// =============================================================================
// Types
// =============================================================================

type LoginPhase = "email" | "otp" | "verifying" | "success";

interface LoginFormProps {
  onSuccess?: (session: Session) => void;
  redirectTo?: string;
}

// =============================================================================
// Component
// =============================================================================

export function LoginForm({
  onSuccess,
  redirectTo = "/",
}: LoginFormProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [phase, setPhase] = useState<LoginPhase>("email");
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Form Hooks
  // ---------------------------------------------------------------------------
  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
    setError: setEmailError,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const {
    control: otpControl,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpFormErrors },
    setValue: setOTPValue,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    defaultValues: { otp: "" },
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const startResendCooldown = (seconds: number = 60) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOTP = async (data: EmailFormData) => {
    try {
      setOtpError(null);
      await authClient.signInWithOTP(data.email);
      setSubmittedEmail(data.email);
      setPhase("otp");
      startResendCooldown(60);
    } catch (error) {
      const message = formatAuthError(error);
      setEmailError("email", { message });
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setOtpError(null);

    try {
      await authClient.signInWithOTP(submittedEmail);
      startResendCooldown(60);
    } catch (error) {
      const message = formatAuthError(error);
      setOtpError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async (data: OTPFormData) => {
    setPhase("verifying");
    setOtpError(null);

    try {
      const session = await authClient.verifyOTP(submittedEmail, data.otp);
      setPhase("success");

      // Call success callback if provided
      onSuccess?.(session);

      // Redirect after brief success display
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 500);
    } catch (error) {
      setPhase("otp");
      const errorMessage = formatAuthError(error);

      // Map error messages to user-friendly versions
      if (errorMessage.toLowerCase().includes("invalid")) {
        setOtpError("Invalid code. Please check and try again.");
      } else if (errorMessage.toLowerCase().includes("expired")) {
        setOtpError("This code has expired. Please request a new one.");
      } else if (errorMessage.toLowerCase().includes("admin")) {
        setOtpError("Access denied. Admin privileges required.");
      } else {
        setOtpError(errorMessage);
      }
    }
  };

  const handleBackToEmail = () => {
    setPhase("email");
    setOtpError(null);
    setOTPValue("otp", "");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <YStack gap="$4">
      {/* Header */}
      <YStack gap="$2" alignItems="center">
        <H2>Admin Sign In</H2>
        <Body textAlign="center" color="$colorMuted">
          {phase === "email"
            ? "Enter your email to receive a verification code"
            : `We sent a code to ${submittedEmail}`}
        </Body>
      </YStack>

      {/* Email Phase */}
      {phase === "email" && (
        <form onSubmit={handleEmailSubmit(handleRequestOTP)}>
          <YStack gap="$4">
            <Controller
              name="email"
              control={emailControl}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  label="Email"
                  placeholder="admin@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  disabled={isEmailSubmitting}
                  error={error?.message ?? emailErrors.email?.message}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />

              <Button
                themeInverse
                disabled={isEmailSubmitting}
              >
                {isEmailSubmitting ? "Sending..." : "Send Code"}
              </Button>
          </YStack>
        </form>
      )}

      {/* OTP Phase */}
      {(phase === "otp" || phase === "verifying") && (
        <YStack gap="$4">
          <form onSubmit={handleOTPSubmit(handleVerifyOTP)}>
            <YStack gap="$4">
              <Controller
                name="otp"
                control={otpControl}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <YStack gap="$2">
                    <OTPCodeInput
                      value={value}
                      onChange={onChange}
                      disabled={phase === "verifying"}
                      error={otpError ?? error?.message ?? otpFormErrors.otp?.message}
                    />
                    <Text fontSize="$2" color="$colorMuted" textAlign="center">
                      Enter the 6-digit code sent to your email
                    </Text>
                  </YStack>
                )}
              />

              <Button
                themeInverse
                disabled={phase === "verifying"}
              >
                {phase === "verifying" ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </YStack>
          </form>

          {/* Resend and Back Options */}
          <XStack justifyContent="space-between" paddingTop="$2">
            <Button
              onPress={handleBackToEmail}
              disabled={phase === "verifying"}
            >
              Use different email
            </Button>

            <Button
              onPress={handleResendOTP}
              disabled={resendCooldown > 0 || isResending || phase === "verifying"}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : isResending
                  ? "Sending..."
                  : "Resend code"}
            </Button>
          </XStack>
        </YStack>
      )}

      {/* Success Phase */}
      {phase === "success" && (
        <YStack gap="$4" alignItems="center">
          <Text color="$success">Successfully signed in!</Text>
          <Text color="$colorMuted">Redirecting to dashboard...</Text>
        </YStack>
      )}
    </YStack>
  );
}
