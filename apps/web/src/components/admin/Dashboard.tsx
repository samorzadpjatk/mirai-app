"use client";

import { AdminTile } from "./AdminTile";
import {
  IoPeople,
  IoPeopleCircle,
  IoCash,
  IoList,
  IoNotifications,
  IoTrophy,
  IoGift,
  IoPulse,
  IoCalendar,
} from "react-icons/io5";
import type { IconType } from "react-icons";

// Tile configuration matching native app
const tiles: {
  href: string;
  title: string;
  subtitle: string;
  icon: IconType;
  accentColor: string;
  accentBg: string;
}[] = [
  {
    href: "/users",
    title: "Users",
    subtitle: "Manage accounts",
    icon: IoPeople,
    accentColor: "#00ced1", // cyan
    accentBg: "rgba(0, 206, 209, 0.1)",
  },
  {
    href: "/groups",
    title: "Groups",
    subtitle: "Teams & roles",
    icon: IoPeopleCircle,
    accentColor: "#94a3b8", // slate
    accentBg: "rgba(27, 40, 40, 0.4)",
  },
  {
    href: "/coins",
    title: "Coins",
    subtitle: "Currency & transactions",
    icon: IoCash,
    accentColor: "#E533FF", // magenta
    accentBg: "rgba(229, 51, 255, 0.1)",
  },
  {
    href: "/transactions",
    title: "Transactions",
    subtitle: "History & logs",
    icon: IoList,
    accentColor: "#00ced1", // cyan
    accentBg: "rgba(0, 206, 209, 0.1)",
  },
  {
    href: "/notifications",
    title: "Notifications",
    subtitle: "Schedules & alerts",
    icon: IoNotifications,
    accentColor: "#E533FF", // magenta
    accentBg: "rgba(229, 51, 255, 0.1)",
  },
  {
    href: "/challenges",
    title: "Challenges",
    subtitle: "Points & tasks",
    icon: IoTrophy,
    accentColor: "#00ced1", // cyan
    accentBg: "rgba(0, 206, 209, 0.1)",
  },
  {
    href: "/rewards",
    title: "Rewards",
    subtitle: "Manage prizes",
    icon: IoGift,
    accentColor: "#E533FF", // magenta
    accentBg: "rgba(229, 51, 255, 0.1)",
  },
  {
    href: "/activity",
    title: "Activity",
    subtitle: "Feed moderation",
    icon: IoPulse,
    accentColor: "#94a3b8", // slate
    accentBg: "rgba(27, 40, 40, 0.4)",
  },
  {
    href: "/schedules",
    title: "Schedules",
    subtitle: "Trip timelines",
    icon: IoCalendar,
    accentColor: "#94a3b8", // slate
    accentBg: "rgba(27, 40, 40, 0.4)",
  },
];

export function Dashboard() {
  return (
    <section className="space-y-6">
      {/* Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <AdminTile key={tile.href} {...tile} />
        ))}
      </div>
    </section>
  );
}
