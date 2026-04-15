import type { ChangeEvent } from "react";

interface TimeInputProps {
  label?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
}

export function TimeInput({
  label,
  value,
  onChange,
  name,
  disabled,
}: TimeInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        type="time"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
