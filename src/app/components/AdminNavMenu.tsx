"use client"

import { TabNav } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AdminNavMenu = () => {
    const pathname = usePathname();
    return (<TabNav.Root size={{ "initial": "1" }}>
        <TabNav.Link asChild active={pathname?.includes("groups")}>
            <Link href="groups">🏛️ Gildie</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("users")}>
            <Link href="users">👥 Użytkownicy</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("coins")}>
            <Link href="coins">💰 Monety</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={pathname?.includes("transactions")}>
            <Link href="transactions">📊 Historia</Link>
        </TabNav.Link>
    </TabNav.Root>);
}

export default AdminNavMenu;