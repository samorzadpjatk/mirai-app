"use client"

import { useState } from "react";
import { useAuth } from "../authHooks";

export interface LoginFormData {
  email: string;
}

export interface LoginFormState {
  email: string;
  isLoading: boolean;
  isSent: boolean; // indicates a login email/OTP has been sent
  error: string | null;
}

export interface UseLoginFormResult {
  formState: LoginFormState;
  setEmail: (email: string) => void;
  handleSubmit: (onSuccess?: () => void) => Promise<void>;
  clearError: () => void;
  clearSent: () => void;
}

export function useLoginForm(): UseLoginFormResult {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithOtp } = useAuth();

  const handleSubmit = async (_onSuccess?: () => void) => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithOtp({ email });
      // We don't navigate here — email/OTP flow will sign the user in when they complete the link/code.
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send login email");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearSent = () => setIsSent(false);

  return {
    formState: { email, isLoading, isSent, error },
    setEmail,
    handleSubmit,
    clearError,
    clearSent,
  };
}
