"use client";

import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  id,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border focus:border-primary focus:ring-primary/20"
        } ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
