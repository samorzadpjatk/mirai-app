"use client";

import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@mirai-app/auth/client";
import { IoChevronBack } from "react-icons/io5";
import { TripSelector } from "./TripSelector";

interface HeaderProps {
  currentPath: string;
}

// Map paths to page titles (for non-dashboard pages)
const pageTitles: Record<string, string> = {
  "/users": "Users",
  "/groups": "Groups",
  "/challenges": "Challenges",
  "/rewards": "Rewards",
  "/notifications": "Notifications",
  "/schedules": "Schedules",
  "/transactions": "Transactions",
  "/coins": "Coins",
  "/activity": "Activity",
};

export function Header({ currentPath }: HeaderProps) {
  const { user } = useAuth();
  const isDashboard = currentPath === "/";
  const pageTitle = pageTitles[currentPath];

  return (
    <header className="border-b border-border-subtle bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side: Logo or Back + Page title */}
        <div className="flex items-center gap-4">
          {isDashboard ? (
            <a href="/" className="flex items-center py-2">
              <img
                src="/mirai_logo.png"
                alt="Mirai"
                className="h-10 w-auto md:h-12"
              />
            </a>
          ) : (
            <>
              <a
                href="/"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-text-secondary transition hover:bg-surface hover:text-primary"
              >
                <IoChevronBack size={22} />
                <span className="hidden text-sm font-medium sm:inline">
                  Back
                </span>
              </a>
              {pageTitle && (
                <h1 className="text-xl font-bold text-text-primary">
                  {pageTitle}
                </h1>
              )}
            </>
          )}
        </div>

        {/* Right side: Trip switcher, profile name, logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <TripSelector />
          </div>
          {user && (
            <span className="hidden text-sm text-text-secondary md:inline">
              {user.name ?? user.email ?? "Admin"}
            </span>
          )}
          <LogoutButton className="text-text-secondary hover:text-text-primary" />
        </div>
      </div>

      {/* Trip switcher on mobile - always visible */}
      <div className="border-t border-border-subtle px-4 py-2.5 sm:hidden">
        <TripSelector />
      </div>
    </header>
  );
}
