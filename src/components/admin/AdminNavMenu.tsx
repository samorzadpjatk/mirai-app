"use client"

import { TabNav } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminNavMenu = () => {
    const pathname = usePathname();
    return (<TabNav.Root size={{ "initial": "1", "xs": "2", "sm": "2" }}>
        <TabNav.Link asChild active={pathname?.includes("groups")}>
            <Link href="groups">🏛️ Guilds</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("users")}>
            <Link href="users">👥 Companions</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("coins")}>
            <Link href="coins">💰 Coins</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("transactions")}>
            <Link href="transactions">📊 History</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("schedules")}>
            <Link href="schedules">🔔 Schedules</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("notifications")}>
            <Link href="notifications">📨 Powiadomienia</Link>
        </TabNav.Link>
    </TabNav.Root>);
}

export default AdminNavMenu;