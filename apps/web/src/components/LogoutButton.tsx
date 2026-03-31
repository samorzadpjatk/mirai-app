"use client";

import { useState } from "react";
import { logout } from "../lib/logout";
import { IoLogOutOutline } from "react-icons/io5";

export interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    // Note: page will redirect, so no need to setIsLoading(false)
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoading}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        isLoading
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-white-10 hover:text-text-primary"
      } ${className}`}
    >
      <IoLogOutOutline size={18} />
      <span className="hidden sm:inline">
        {isLoading ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}
