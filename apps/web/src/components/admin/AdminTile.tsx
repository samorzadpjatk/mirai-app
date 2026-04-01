"use client";

import type { IconType } from "react-icons";

interface AdminTileProps {
  title: string;
  subtitle: string;
  icon: IconType;
  href: string;
  accentColor: string;
  accentBg: string;
}

export function AdminTile({
  title,
  subtitle,
  icon: Icon,
  href,
  accentColor,
  accentBg,
}: AdminTileProps) {
  return (
    <a
      href={href}
      className="rounded-lg border border-border-subtle bg-card p-4 transition hover:border-border-light hover:shadow-lg"
      style={
        {
          "--tile-accent": accentColor,
          "--tile-accent-bg": accentBg,
        } as React.CSSProperties
      }
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border"
        style={{
          backgroundColor: accentBg,
          borderColor: accentColor,
        }}
      >
        <Icon size={24} color={accentColor} />
      </div>
      <p className="text-lg font-bold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
    </a>
  );
}
