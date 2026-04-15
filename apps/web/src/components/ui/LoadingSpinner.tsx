interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-subtle border-t-primary" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
