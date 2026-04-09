"use client";

import { useLoginForm, useAuth } from "@mirai-app/frameworks/auth/client";
import { useState } from "react";
import { OTPCodeInput } from "./OTPCodeInput";
import { authStore } from "@mirai-app/frameworks/auth/client";
import { checkIsAdminUser } from "../lib/auth";

export function LoginForm() {
  const { formState, setEmail, handleSubmit, clearError } = useLoginForm();
  const { verifyOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const onVerifyOtp = async () => {
    if (otp.length !== 6) {
      setVerifyError("Please enter the 6-digit code from your email.");
      return;
    }

    setVerifyError(null);
    setVerifyLoading(true);

    try {
      await verifyOtp({ email: formState.email, token: otp });

      const isAdmin = await checkIsAdminUser();
      if (!isAdmin) {
        setVerifyError("Your account does not have admin access.");
        return;
      }

      const session = authStore.getState().session;
      if (session?.access_token) {
        document.cookie = `sb-access-token=${session.access_token}; Path=/; SameSite=Lax`;
      }
      if (session?.refresh_token) {
        document.cookie = `sb-refresh-token=${session.refresh_token}; Path=/; SameSite=Lax`;
      }

      window.location.href = "/";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OTP verification failed.";
      if (/expired/i.test(message)) {
        setVerifyError("This code has expired. Please request a new one.");
      } else if (/invalid|token/i.test(message)) {
        setVerifyError("Invalid code. Please check and try again.");
      } else {
        setVerifyError(message);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const onEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setVerifyError(null);
    await handleSubmit();
  };

  const canSend = !!formState.email.trim() && !formState.isLoading;

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border-subtle bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text-primary">
        Admin sign in
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Enter your email to receive a 6-digit OTP code.
      </p>

      <form
        onSubmit={(event) => void onEmailSubmit(event)}
        className="mt-6 space-y-3"
      >
        <label
          className="block text-sm font-medium text-text-secondary"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={formState.isLoading || verifyLoading}
          required
        />

        {formState.error ? (
          <p className="text-sm text-danger" role="alert">
            {formState.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSend}
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formState.isLoading
            ? "Sending..."
            : formState.isSent
              ? "Resend code"
              : "Send code"}
        </button>
      </form>

      {formState.isSent ? (
        <div className="mt-6 space-y-3 border-t border-border-subtle pt-6">
          <p className="text-sm text-text-secondary">
            We sent a verification code to <strong>{formState.email}</strong>.
          </p>

          <label
            className="block text-sm font-medium text-text-secondary"
            htmlFor="otp-code"
          >
            One-time passcode
          </label>
          <div id="otp-code">
            <OTPCodeInput
              value={otp}
              onChange={setOtp}
              disabled={verifyLoading}
            />
          </div>

          {verifyError ? (
            <p className="text-sm text-danger" role="alert">
              {verifyError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onVerifyOtp}
            disabled={verifyLoading}
            className="w-full rounded-lg bg-surface px-4 py-2 font-medium text-text-primary border border-border transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifyLoading ? "Verifying..." : "Verify and sign in"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
