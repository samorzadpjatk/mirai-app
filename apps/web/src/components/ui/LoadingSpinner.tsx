"use client";

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div
      className="inline-flex items-center gap-2 text-sm text-text-secondary"
      role="status"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border-light border-t-primary" />
      <span>{label}</span>
    </div>
  );
}
