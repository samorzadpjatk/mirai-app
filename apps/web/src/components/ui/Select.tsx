import type { ChangeEvent, ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  name?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  name,
  disabled,
  placeholder,
}: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
