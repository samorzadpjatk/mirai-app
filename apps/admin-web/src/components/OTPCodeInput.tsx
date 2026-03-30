"use client";

interface OTPCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPCodeInput({
  value,
  onChange,
  disabled = false,
}: OTPCodeInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const normalized = event.target.value
          .replace(/[^0-9]/g, "")
          .slice(0, 6);
        onChange(normalized);
      }}
      placeholder="123456"
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-center text-xl tracking-[0.3em] text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}
