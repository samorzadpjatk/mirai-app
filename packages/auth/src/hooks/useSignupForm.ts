"use client"

import { useState } from "react";
import { useAuth } from "../authHooks";

export interface SignupFormState {
  name: string;
  email: string;
  isLoading: boolean;
  isSent: boolean;
  error: string | null;
}

export interface UseSignupFormResult {
  formState: SignupFormState;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  handleSubmit: (onSuccess?: () => void) => Promise<void>;
  clearError: () => void;
  clearSent: () => void;
}

export function useSignupForm(): UseSignupFormResult {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signUpWithOtp } = useAuth();

  const handleSubmit = async (onSuccess?: () => void) => {
    if (!name?.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email) {
      setError("Please enter your email");
      return;
    }

    // basic email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signUpWithOtp({ email, metadata: { name } });
      setIsSent(true);
      // Do NOT call onSuccess — user needs to verify OTP to complete signup
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearSent = () => setIsSent(false);

  return {
    formState: { name, email, isLoading, isSent, error },
    setName,
    setEmail,
    handleSubmit,
    clearError,
    clearSent,
  };
}
