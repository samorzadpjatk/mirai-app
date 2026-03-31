"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-background hover:brightness-110 active:brightness-90 disabled:opacity-50",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-card active:bg-background disabled:opacity-50 disabled:text-text-muted",
  ghost:
    "bg-transparent text-text-secondary hover:bg-white-10 hover:text-text-primary active:bg-white-5 disabled:text-text-muted",
  danger:
    "bg-danger text-white hover:brightness-110 active:brightness-90 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
