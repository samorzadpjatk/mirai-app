"use client";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/groups", label: "Groups", icon: "👨‍👩‍👧‍👦" },
  { href: "/challenges", label: "Challenges", icon: "🏆" },
  { href: "/rewards", label: "Rewards", icon: "🎁" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/schedules", label: "Schedules", icon: "📅" },
  { href: "/transactions", label: "Transactions", icon: "💳" },
  { href: "/coins", label: "Coins", icon: "🪙" },
  { href: "/activity", label: "Activities", icon: "📋" },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const isActive = (href: string) => {
    if (href === "/") {
      return currentPath === "/" || currentPath === "";
    }
    return currentPath.startsWith(href);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border-subtle bg-card">
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-primary-10 text-primary"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
