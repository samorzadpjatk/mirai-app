import type { ReactNode, MouseEvent } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary:
      "border border-border-subtle bg-card text-text-primary hover:bg-surface",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface",
    danger: "bg-danger text-white hover:bg-danger/90",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
