import type { ChangeEvent } from "react";

interface InputProps {
  label?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  name,
  required,
  disabled,
  type = "text",
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
