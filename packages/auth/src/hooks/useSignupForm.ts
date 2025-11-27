import { useState } from "react";
import { useAuth } from "../authHooks";

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignupFormState extends SignupFormData {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseSignupFormResult {
  formState: SignupFormState;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  handleSubmit: (onSuccess?: () => void) => Promise<void>;
  clearError: () => void;
}

export function useSignupForm(): UseSignupFormResult {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { signUpWithEmail } = useAuth();

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return false;
    }
    if (!email?.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (onSuccess?: () => void) => {
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await signUpWithEmail({
        email,
        password,
        metadata: { name },
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    formState: {
      name,
      email,
      password,
      confirmPassword,
      isLoading,
      error,
      success,
    },
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    clearError,
  };
}
