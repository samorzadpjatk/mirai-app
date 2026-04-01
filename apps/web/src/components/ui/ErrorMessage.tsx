"use client";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div
      className={`rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}
