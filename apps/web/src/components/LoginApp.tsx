"use client";

import { AuthProvider } from "./AuthProvider";
import { LoginForm } from "./LoginForm";

export function LoginApp() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
