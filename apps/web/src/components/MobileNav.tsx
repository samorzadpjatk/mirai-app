"use client";

import { IoHome, IoChevronBack } from "react-icons/io5";

interface MobileNavProps {
  currentPath: string;
}

export function MobileNav({ currentPath }: MobileNavProps) {
  const isDashboard = currentPath === "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-card md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-14 items-center justify-around px-4">
        {isDashboard ? (
          <div className="flex items-center gap-2 text-primary">
            <IoHome size={24} />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
        ) : (
          <>
            <a
              href="/"
              className="flex items-center gap-2 text-text-secondary hover:text-primary"
            >
              <IoChevronBack size={20} />
              <span className="text-sm font-medium">Back</span>
            </a>
            <a
              href="/"
              className="flex items-center gap-2 text-text-secondary hover:text-primary"
            >
              <IoHome size={20} />
              <span className="text-sm font-medium">Home</span>
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
