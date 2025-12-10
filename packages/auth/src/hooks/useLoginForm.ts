"use client"

import { useState } from "react";
import { useAuth } from "../authHooks";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

export interface UseLoginFormResult {
  formState: LoginFormState;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleSubmit: (onSuccess?: () => void) => Promise<void>;
  clearError: () => void;
}

export function useLoginForm(): UseLoginFormResult {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithEmail } = useAuth();

  const handleSubmit = async (onSuccess?: () => void) => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmail({ email, password });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    formState: { email, password, isLoading, error },
    setEmail,
    setPassword,
    handleSubmit,
    clearError,
  };
}
