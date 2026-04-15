import type { ChangeEvent } from "react";

interface DateInputProps {
  label?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
}

export function DateInput({
  label,
  value,
  onChange,
  name,
  disabled,
}: DateInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
