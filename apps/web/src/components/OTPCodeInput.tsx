"use client";

/**
 * OTP Code Input Component
 *
 * Specialized input for 6-digit one-time passcodes with numeric keypad
 * support and auto-complete for iOS/macOS password autofill.
 *
 * Features:
 * - Numeric-only input (filters non-digits)
 * - Auto-complete for OTP codes
 * - Visual tracking for 6 digits
 * - Disabled state support
 */

import { Input } from "@/components/ui/Input";

interface OTPCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Normalizes input to only allow digits and max 6 characters
 */
function normalizeOTP(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 6);
}

export function OTPCodeInput({
  value,
  onChange,
  disabled = false,
  error,
}: OTPCodeInputProps) {
  const handleChange = (text: string) => {
    const normalized = normalizeOTP(text);
    onChange(normalized);
  };

  return (
    <Input
      value={value}
      onChangeText={handleChange}
      disabled={disabled}
      error={error}
      placeholder="123456"
      keyboardType="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      textAlign="center"
      size="lg"
    />
  );
}
