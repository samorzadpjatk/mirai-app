"use client"
import { TabNav } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavMenu = () => {
    const pathname = usePathname();
    return <TabNav.Root >
        <TabNav.Link asChild active={pathname === "/"} className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}><Link href={"/"}>Strona główna</Link></TabNav.Link>
        <TabNav.Link asChild active={pathname === "/ranking"} className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}><Link href={"/ranking"}>Ranking grup</Link></TabNav.Link>
        <TabNav.Link asChild active={pathname === "/group/create"} className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}><Link href={"/group/create"}>Utwórz grupę</Link></TabNav.Link>
        <TabNav.Link asChild active={pathname === "/group/join"} className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}><Link href={"/group/join"}>Dołącz do grupy</Link></TabNav.Link>
        <TabNav.Link asChild active={pathname === "/admin"} className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}><Link href={"/admin"}>Panel admina</Link></TabNav.Link>
    </TabNav.Root>;
}
export default NavMenu;