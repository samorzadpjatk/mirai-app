"use client";

/**
 * Login App Component
 *
 * Page-level component for the login page. Wraps the login form in a Card
 * and provides consistent styling for the login experience.
 *
 * Features:
 * - Card-based layout with consistent styling
 * - Centered presentation
 * - Automatic redirect handling
 * - Tamagui theme integration
 */

import { Card } from "@/components/ui";
import { LoginForm } from "./LoginForm";

/**
 * Get redirect URL from query parameters if present
 */
function getRedirectUrl(): string {
  if (typeof window === "undefined") return "/";

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  // Validate redirect to prevent open redirect vulnerabilities
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return "/";
}

export function LoginApp() {
  const redirectTo = getRedirectUrl();

  return (
    <Card
      size="lg"
      elevation="md"
      padding="$6"
      width="100%"
    >
      <LoginForm redirectTo={redirectTo} />
    </Card>
  );
}
